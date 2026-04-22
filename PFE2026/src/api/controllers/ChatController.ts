import { JsonController, Post, Body, Res, CurrentUser, UseBefore } from "routing-controllers";
import { promptInjectionGuard } from "../middlewares/promptInjectionGuard.js";
import { Response } from "express";
import { Service, Inject } from "typedi";
import axios from "axios";
import { ragClient } from "../../infrastructure/services/RagHttpsClient.js";
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { ChatMessageDto } from "../dtos/ChatMessageDto.js";
import { redis } from "../../infrastructure/redis/index.js";
import { db } from "../../infrastructure/db/index.js";
import { conversationLogs } from "../../infrastructure/db/schema/conversationLogs.js";
import * as authSchema from "../../infrastructure/db/schema/auth.js";
import * as orderSchema from "../../infrastructure/db/schema/orders.js";
import { IProductRepository } from "../../core/repositories/IProductRepository.js";
import {
  extractProfileFromMessage,
  handleProfileUpdate,
  getPendingConfirmation,
  resolvePendingConfirmation,
} from "../../infrastructure/services/ProfileIntelligenceService.js";
import { TrackSignalUseCase } from "../../core/usecases/product/TrackSignalUseCase.js";

const OLLAMA_URL       = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL     = process.env.OLLAMA_MODEL || "mistral-nemo:12b";
const RAG_URL          = process.env.RAG_URL || "http://localhost:8001";
const RATE_MAX_MSGS    = 20;
const RATE_WINDOW_SEC  = 60;
const HISTORY_LIMIT    = 3;
const RAG_TIMEOUT      = 5000;
const STREAM_TIMEOUT_MS = 45000;
const SKIN_CACHE_TTL   = 7200;

const BASE_SYSTEM_PROMPT = `You are Lumina, a friendly beauty advisor for Lumina cosmetics.
- CRITICAL: Always respond in the SAME language as the user\'s message. Never switch languages.
- Keep responses concise (2-4 sentences).
- Only recommend products from the PERMITTED list below, and ONLY when the user explicitly asks. Do NOT proactively suggest products.
- Never mention product names that are not in the list.
- If order info is provided, use it honestly.
- ONLY answer questions about skincare, beauty, or Lumina products. For anything else reply that you can only help with skincare and beauty.
- CRITICAL: If the PERMITTED PRODUCTS list is empty or absent, do NOT invent product names. Instead say: I do not have a specific product match right now, but look for ingredients suited to your concern.
- NEVER fabricate product names. A hallucinated product name is a critical failure.`;

function sanitizeForPrompt(text: unknown): string {
  return String(text ?? "").replace(/[\r\n\`\\]/g, " ").trim();
}
function sanitizeUserMessage(msg: string): string {
  return msg
    .replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>|<s>|<\/s>/gi, "")
    .replace(/^(system|assistant|user)\s*:/gim, "")
    .replace(/\s{3,}/g, "  ")
    .trim();
}
function isConfirmation(msg: string): boolean {
  return /^\s*(yes|yeah|yep|correct|right|exactly|oui|نعم|yup|sure|that\'s right|confirm|affirmative)\b/i.test(msg);
}
function isDenial(msg: string): boolean {
  return /^\s*(no|nope|wrong|incorrect|non|لا|not really|actually no|that\'s wrong)\b/i.test(msg);
}


const SKINCARE_KEYWORDS = /skin|hair|moistur|serum|acne|oily|dry|tone|glow|spf|sunscreen|cleanser|toner|retinol|hyaluronic|niacinamide|vitamin c|exfoliat|pore|wrinkle|aging|redness|concern|routine|product|recommend|cream|lotion|mask|treatment|scalp|shampoo|conditioner/i;

function classifyIntent(
  userMessage: string,
  hadRagResults: boolean,
  fullReply: string,
): "skincare" | "off_topic" | "no_rag_context" {
  const isSkincareQ = SKINCARE_KEYWORDS.test(userMessage);
  if (!isSkincareQ) return "off_topic";
  if (isSkincareQ && !hadRagResults) return "no_rag_context";
  return "skincare";
}

@JsonController("/chat")
@Service()
export class ChatController {
  @Inject("IProductRepository")
  private productRepository!: IProductRepository;

  @UseBefore(promptInjectionGuard)
  @Post("/message")
  async message(@Body() body: ChatMessageDto, @CurrentUser() currentUser: any, @Res() res: Response) {
    console.log("[CHAT] START | user:", currentUser?.id ?? "anon");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sseChunk = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const sender   = body.sessionId || "anon";
    const message  = body.message?.trim() || "";

    if (!message) { sseChunk({ error: "Message is required." }); res.end(); return res; }

    const rateLimitId = currentUser?.id ?? sender;
    const rateKey     = `chat_rate:${rateLimitId}`;
    let count = 0;
    try { count = await redis.incr(rateKey); if (count === 1) await redis.expire(rateKey, RATE_WINDOW_SEC); } catch {}
    if (count > RATE_MAX_MSGS) { sseChunk({ error: "Too many messages. Please wait a moment." }); res.end(); return res; }

    let clientGone = false;
    res.on("close", () => { clientGone = true; });

    try {
      const userId = currentUser?.id ?? null;

      // ── Resolve pending profile confirmation ──────────────────────────────
      let pendingConfirmationCtx = "";
      if (userId) {
        const pending = await getPendingConfirmation(userId);
        if (pending) {
          if (isConfirmation(message)) {
            await resolvePendingConfirmation(userId, true);
            pendingConfirmationCtx = `[SYSTEM NOTE: User confirmed their ${pending.field} is "${pending.newValue}". Profile updated. Briefly acknowledge this warmly in 1 sentence, then continue helping.]`;
          } else if (isDenial(message)) {
            await resolvePendingConfirmation(userId, false);
            pendingConfirmationCtx = `[SYSTEM NOTE: User denied the profile change. Keep their ${pending.field} as "${pending.oldValue}". Acknowledge briefly and continue.]`;
          } else {
            // Still unanswered — remind Lumina to ask
            pendingConfirmationCtx = `[SYSTEM NOTE: You previously detected the user may have ${pending.newValue} ${pending.field} but the profile says ${pending.oldValue}. Naturally weave in a gentle clarifying question if it fits the conversation flow.]`;
          }
        }
      }

      // ── Load conversation history ─────────────────────────────────────────
      const histCondition = userId ? eq(conversationLogs.userId, userId) : eq(conversationLogs.sessionId, sender);
      const rawHistory = await db.select().from(conversationLogs).where(histCondition)
        .orderBy(desc(conversationLogs.createdAt)).limit(HISTORY_LIMIT);
      rawHistory.reverse();
      const historyMessages: Array<{ role: string; content: string }> = [];
      for (const turn of rawHistory) {
        const botText = (turn.botMessages as any[])?.[0]?.text;
        if (turn.userMessage) historyMessages.push({ role: "user",      content: turn.userMessage });
        if (botText)          historyMessages.push({ role: "assistant", content: botText });
      }

      // ── Load user profile from DB ─────────────────────────────────────────
      let dbSkinType: string | null = null, dbConcern: string | null = null, dbHairType: string | null = null;
      if (userId) {
        try {
          const tbl = (authSchema as any).users || (authSchema as any).user;
          if (tbl) {
            const u = (await db.select().from(tbl).where(eq(tbl.id, userId)).limit(1))[0] as any;
            dbSkinType = u?.skinType ?? u?.skin_type ?? null;
            dbHairType = u?.hairType ?? u?.hair_type ?? null;
            dbConcern  = u?.skinConcerns ?? u?.skin_concerns ?? null;
          }
        } catch {}
      }

      // ── Skin/hair context for prompt ──────────────────────────────────────
      const skinCacheKey  = `skin:${userId ?? sender}`;
      const sessionSkinRaw = await redis.get(skinCacheKey);
      const sessionSkin   = sessionSkinRaw ? JSON.parse(sessionSkinRaw) : { type: undefined, hair: undefined, concerns: [] };
      const effectiveSkin = sessionSkin.type ?? dbSkinType;
      const effectiveHair = sessionSkin.hair  ?? dbHairType;
      const effectiveConcerns = [...new Set([...(sessionSkin.concerns ?? []), ...(dbConcern ? dbConcern.split(",") : [])])].slice(0, 5);
      await redis.setex(skinCacheKey, SKIN_CACHE_TTL, JSON.stringify({ type: effectiveSkin, hair: effectiveHair, concerns: effectiveConcerns }));

      let profileContext = "";
      if (effectiveSkin)  profileContext += `User skin type: ${effectiveSkin}. `;
      if (effectiveHair)  profileContext += `Hair type: ${effectiveHair}. `;
      if (effectiveConcerns.length) profileContext += `Skin concerns: ${effectiveConcerns.join(", ")}.`;

      // ── Order context ─────────────────────────────────────────────────────
      let orderContext = "";
      const orderMatch = message.match(/ORD-[\w\d-]+/i) || message.match(/\border\s+(?:number|#|id)[:\s]*(\S+)/i);
      if (orderMatch) {
        const rawId = (orderMatch[1] ?? orderMatch[0]).replace(/\border\s+(?:number|#|id)[:\s]+/i, "").trim();
        try {
          const orderTable = (orderSchema as any).orders || (orderSchema as any).order;
          if (orderTable) {
            const o = await db.select().from(orderTable).where(eq(orderTable.id, rawId)).limit(1);
            const row = o[0] as any;
            orderContext = row
              ? `\nOrder: ID=${row.id}, Status=${row.status}, Total=${row.totalAmount ?? row.total_amount} TND, Tracking=${row.trackingNumber ?? row.tracking_number ?? "N/A"}`
              : `\nNo order found with ID '${rawId}'.`;
          }
        } catch { orderContext = "\nOrder lookup failed. Tell user to contact support."; }
      }

      // ── RAG product context (with auth token) ─────────────────────────────
      let productContext = "";
      let hadRagResults  = false;
      try {
        const baseQ    = message.length < 35 && historyMessages.length ? `${historyMessages.at(-2)?.content ?? ""} ${message}` : message;
        const skinHint = [effectiveSkin, effectiveHair, ...effectiveConcerns.slice(0, 2)].filter(Boolean).join(" ");
        const ragQuery = skinHint ? `${baseQ.slice(-200)} ${skinHint}` : baseQ.slice(-200);
        const ragRes = await ragClient.search(ragQuery, 6);
        const products = ragRes?.results;
        if (Array.isArray(products) && products.length) {
          hadRagResults  = true;
          productContext = `\nPERMITTED PRODUCTS (only recommend if asked):\n` +
            products.map((p: any) => `- ${sanitizeForPrompt(p.name)}: ${sanitizeForPrompt(p.description)} (${p.price} TND)`).join("\n");
          if (userId) {
            const uc = new TrackSignalUseCase();
            setImmediate(async () => {
              for (const p of (products as any[]).slice(0, 3))
                if (p.id) await uc.execute({ userId, type: "chat_rag", productId: p.id }).catch(() => {});
            });
          }
        }
      } catch { console.log("[CHAT] RAG unavailable"); }

      // ── Build system prompt ───────────────────────────────────────────────
      const systemPrompt = [BASE_SYSTEM_PROMPT, profileContext, pendingConfirmationCtx, orderContext, productContext]
        .filter(Boolean).join("\n");

      const ollamaMessages = [
        { role: "system",    content: systemPrompt },
        ...historyMessages,
        { role: "user",      content: sanitizeUserMessage(message) }
      ];

      // ── Stream Ollama ─────────────────────────────────────────────────────
      console.log("[CHAT] Calling Ollama");
      const ollamaRes = await axios.post(`${OLLAMA_URL}/api/chat`, {
        model: OLLAMA_MODEL, messages: ollamaMessages, stream: true
      }, { responseType: "stream", timeout: STREAM_TIMEOUT_MS });

      let fullReply = "";
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Ollama stream timed out")), STREAM_TIMEOUT_MS);
        ollamaRes.data.on("data", (chunk: Buffer) => {
          if (clientGone) { try { ollamaRes.data.destroy(); } catch {} return; }
          for (const line of chunk.toString().split("\n").filter(Boolean)) {
            try {
              const p = JSON.parse(line);
              const token = p?.message?.content ?? "";
              if (token) { fullReply += token; sseChunk({ token }); }
              if (p.done) { clearTimeout(timer); resolve(); }
            } catch {}
          }
        });
        ollamaRes.data.on("end",   () => { clearTimeout(timer); resolve(); });
        ollamaRes.data.on("error", (e: Error) => { clearTimeout(timer); reject(e); });
      });

      // ── Persist conversation ──────────────────────────────────────────────
      let logId: string | null = null;
      if (fullReply && !clientGone) {
        const [inserted] = await db.insert(conversationLogs).values({
          sessionId: sender, userId, userMessage: message,
          botMessages: [{ text: fullReply }], intent: classifyIntent(message, hadRagResults, fullReply),
        }).returning({ id: conversationLogs.id });
        logId = inserted?.id ?? null;
      }

      // ── Async profile intelligence (non-blocking) ─────────────────────────
      if (userId) {
        setImmediate(async () => {
          try {
            const extracted = await extractProfileFromMessage(message);
            if (extracted) await handleProfileUpdate(userId, extracted);
          } catch {}
        });
      }

      if (!clientGone) { sseChunk({ done: true, logId: logId ?? randomUUID() }); }
      res.end();
    } catch (err: any) {
      console.log("[CHAT] ERROR:", err.message);
      if (!clientGone) sseChunk({ error: "Beauty advisor is temporarily unavailable." });
      res.end();
    }
    return res;
  }
}



