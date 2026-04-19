import { JsonController, Post, Body, Res, CurrentUser } from "routing-controllers";
import { Response } from "express";
import { Service, Inject } from "typedi";
import axios from "axios";
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { ChatMessageDto } from "../dtos/ChatMessageDto.js";
import { redis } from "../../infrastructure/redis/index.js";
import { db } from "../../infrastructure/db/index.js";
import { conversationLogs } from "../../infrastructure/db/schema/conversationLogs.js";
import * as authSchema from "../../infrastructure/db/schema/auth.js";
import * as orderSchema from "../../infrastructure/db/schema/orders.js";
import { IProductRepository } from "../../core/repositories/IProductRepository.js";

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral-nemo:12b";
const RAG_URL = process.env.RAG_URL || "http://localhost:8001";
const RATE_MAX_MSGS = 20;
const RATE_WINDOW_SEC = 60;
const HISTORY_LIMIT = 3;
const RAG_TIMEOUT = 5000;
const STREAM_TIMEOUT_MS = 45000;
const SKIN_CACHE_TTL = 7200;

const BASE_SYSTEM_PROMPT = `You are Lumiere, a friendly beauty advisor.
- Keep responses concise (2-4 sentences).
- Only recommend products from the PERMITTED list below.
- Never mention product names that are not in the list.
- If order info is provided, use it honestly.`;

function sanitizeForPrompt(text: unknown): string {
  return String(text ?? "").replace(/[\r\n`\\]/g, " ").trim();
}

function sanitizeUserMessage(msg: string): string {
  return msg
    .replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>|<s>|<\/s>/gi, "")
    .replace(/^(system|assistant|user)\s*:/gim, "")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

function extractSkinSignals(msg: string): { type?: string; concerns: string[] } {
  const typeMatch = msg.match(/\b(oily|dry|combination|normal|sensitive|mixed)\b/i);
  const concerns: string[] = [];
  const kw = ["acne","redness","dark spots","hyperpigmentation","aging","wrinkles","dehydration","dehydrated","dullness","dull","pores","blackheads","texture","barrier","blemish","breakout","uneven"];
  for (const c of kw) if (msg.toLowerCase().includes(c)) concerns.push(c);
  return { type: typeMatch?.[1]?.toLowerCase(), concerns };
}

@JsonController("/chat")
@Service()
export class ChatController {
  @Inject("IProductRepository")
  private productRepository!: IProductRepository;

  @Post("/message")
  async message(@Body() body: ChatMessageDto, @CurrentUser() currentUser: any, @Res() res: Response) {
    console.log("[CHAT] START | user:", currentUser?.id ?? "anon");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sseChunk = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const sender = body.sessionId || "anon";
    const message = body.message?.trim() || "";
    if (!message) {
      sseChunk({ error: "Message is required." });
      res.end();
      return res;
    }

    // Rate-limit by userId for auth users (cannot be spoofed via sessionId)
    const rateLimitId = currentUser?.id ?? sender;
    const rateKey = `chat_rate:${rateLimitId}`;
    let count = 0;
    try { count = await redis.incr(rateKey); if (count === 1) await redis.expire(rateKey, RATE_WINDOW_SEC); } catch {}
    console.log("[CHAT] Rate limit:", count);
    if (count > RATE_MAX_MSGS) {
      sseChunk({ error: "Too many messages. Please wait a moment." });
      res.end();
      return res;
    }

    let clientGone = false;
    res.on("close", () => { clientGone = true; console.log("[CHAT] Client disconnected"); });

    try {
      const userId = currentUser?.id ?? null;

      // History: scoped to userId for auth users (cross-session), sessionId for anon
      const historyCondition = userId
        ? eq(conversationLogs.userId, userId)
        : eq(conversationLogs.sessionId, sender);

      const rawHistory = await db
        .select()
        .from(conversationLogs)
        .where(historyCondition)
        .orderBy(desc(conversationLogs.createdAt))
        .limit(HISTORY_LIMIT);
      rawHistory.reverse();

      const historyMessages: Array<{ role: string; content: string }> = [];
      for (const turn of rawHistory) {
        const botText = (turn.botMessages as any[])?.[0]?.text;
        if (turn.userMessage) historyMessages.push({ role: "user", content: turn.userMessage });
        if (botText) historyMessages.push({ role: "assistant", content: botText });
      }

      let dbSkinType: string | null = null, dbConcern: string | null = null;
      if (userId) {
        try {
          const userTable = (authSchema as any).users || (authSchema as any).user;
          if (userTable) {
            const u = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
            const userRow = u[0] as any;
            dbSkinType = userRow?.skinType ?? userRow?.skin_type ?? null;
            dbConcern = userRow?.skinConcern ?? userRow?.skin_concern ?? null;
          }
        } catch {}
      }

      // Skin cache keyed by userId for auth users
      const skinCacheKey = `skin:${userId ?? sender}`;
      const sessionSkinRaw = await redis.get(skinCacheKey);
      const sessionSkin = sessionSkinRaw ? JSON.parse(sessionSkinRaw) : { type: undefined, concerns: [] };
      const signals = extractSkinSignals(message);
      const updatedSkin = {
        type: signals.type ?? sessionSkin.type ?? dbSkinType ?? undefined,
        concerns: [...new Set([...signals.concerns, ...(sessionSkin.concerns||[]), ...(dbConcern?[dbConcern]:[])])].slice(0,5)
      };
      await redis.setex(skinCacheKey, SKIN_CACHE_TTL, JSON.stringify(updatedSkin));
      const skinContext = updatedSkin.type ? `Skin: ${updatedSkin.type}. Concerns: ${updatedSkin.concerns.join(", ")}.` : "";

      let orderContext = "";
      const orderMatch = message.match(/ORD-[\w\d-]+/i) || message.match(/\border\s+(?:number|#|id)[:\s]*(\S+)/i);
      if (orderMatch) {
        const rawId = (orderMatch[1] ?? orderMatch[0]).replace(/\border\s+(?:number|#|id)[:\s]+/i, "").trim();
        try {
          const orderTable = (orderSchema as any).orders || (orderSchema as any).order;
          if (orderTable) {
            const o = await db.select().from(orderTable).where(eq(orderTable.id, rawId)).limit(1);
            const orderRow = o[0] as any;
            orderContext = orderRow ? `\nOrder found:\n- ID: ${orderRow.id}\n- Status: ${orderRow.status}\n- Total: ${orderRow.totalAmount ?? orderRow.total_amount} TND\n- Tracking: ${orderRow.trackingNumber ?? orderRow.tracking_number ?? "N/A"}` : `\nOrder lookup: No order found with ID '${rawId}'.`;
          }
        } catch { orderContext = "\nOrder lookup failed. Tell user to contact support."; }
      }

      let productContext = "PRODUCT CONTEXT UNAVAILABLE - give general advice only.";
      try {
        const baseQ = message.length < 35 && historyMessages.length ? `${historyMessages[historyMessages.length-2]?.content} ${message}` : message;
        const trimmedQ = baseQ.slice(-200);
        const skinHint = [updatedSkin.type, ...updatedSkin.concerns.slice(0,2)].filter(Boolean).join(" ");
        const ragQuery = skinHint ? `${trimmedQ} ${skinHint}` : trimmedQ;
        const ragRes = await axios.get(`${RAG_URL}/search`, { params: { q: ragQuery, limit: 6 }, timeout: RAG_TIMEOUT });
        const products = ragRes.data?.results;
        if (Array.isArray(products) && products.length) {
          const list = products.map((p: any) => `- ${sanitizeForPrompt(p.name)}: ${sanitizeForPrompt(p.description)} ($${p.price})`).join("\n");
          productContext = `PERMITTED PRODUCTS (only recommend these):\n${list}`;
        } else { productContext = "ZERO RESULTS - FORBIDDEN from naming products."; }
      } catch { console.log("[CHAT] RAG failed, using fallback."); }

      // Sanitize user message before sending to LLM (prompt injection guard)
      const safeMessage = sanitizeUserMessage(message);

      const systemPrompt = `${BASE_SYSTEM_PROMPT}\n${skinContext}\n${orderContext}\n${productContext}`;
      const ollamaMessages = [{ role: "system", content: systemPrompt }, ...historyMessages, { role: "user", content: safeMessage }];

      console.log("[CHAT] Calling Ollama at", `${OLLAMA_URL}/api/chat`);
      const ollamaRes = await axios.post(`${OLLAMA_URL}/api/chat`, {
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: true
      }, { responseType: "stream", timeout: STREAM_TIMEOUT_MS });

      let fullReply = "";
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Ollama stream timed out")), STREAM_TIMEOUT_MS);
        ollamaRes.data.on("data", (chunk: Buffer) => {
          if (clientGone) { try { ollamaRes.data.destroy(); } catch {} return; }
          const lines = chunk.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const p = JSON.parse(line);
              const token = p?.message?.content ?? "";
              if (token) { fullReply += token; sseChunk({ token }); }
              if (p.done) { clearTimeout(timer); resolve(); }
            } catch {}
          }
        });
        ollamaRes.data.on("end", () => { clearTimeout(timer); resolve(); });
        ollamaRes.data.on("error", (err: Error) => { clearTimeout(timer); reject(err); });
      });

      let logId: string | null = null;
      if (fullReply && !clientGone) {
        const [inserted] = await db.insert(conversationLogs).values({
          sessionId: sender,
          userId: userId,          // from verified session only, never from client body
          userMessage: message,
          botMessages: [{ text: fullReply }],
          intent: null,
        }).returning({ id: conversationLogs.id });
        logId = inserted?.id ?? null;
        console.log("[CHAT] Logged | userId:", userId ?? "anon", "| logId:", logId);
      }

      if (!clientGone) {
        sseChunk({ done: true, logId: logId ?? randomUUID() });
        console.log("[CHAT] Done");
      }
      res.end();
    } catch (err: any) {
      console.log("[CHAT] ERROR:", err.message);
      if (!clientGone) sseChunk({ error: "Beauty advisor is temporarily unavailable." });
      res.end();
    }
    return res;
  }
}
