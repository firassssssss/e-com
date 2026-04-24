import os, textwrap

BASE = "PFE2026"

files = {}

# ── 1. ProfileIntelligenceService ─────────────────────────────────────────────
files["src/infrastructure/services/ProfileIntelligenceService.ts"] = textwrap.dedent('''
import axios from "axios";
import { redis } from "../redis/index.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import * as authSchema from "../db/schema/auth.js";

const OLLAMA_URL  = (process.env.OLLAMA_URL  || "http://localhost:11434").replace(/\\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral-nemo:12b";
const PENDING_TTL  = 600; // 10 min

export interface ExtractedProfile {
  skinType?:    string | null;
  hairType?:    string | null;
  skinConcerns?: string[];
  confidence:   number;
}

const EXTRACT_SYSTEM = `You are a silent profile extractor for a beauty app.
Given a user message, extract ONLY what the user explicitly states about themselves.
Return ONLY valid JSON — no explanation, no markdown.
Schema: {"skinType":"oily|dry|combination|normal|sensitive|null","hairType":"dry|oily|normal|curly|fine|null","skinConcerns":[],"confidence":0.0}
confidence: 0.9=explicit ("my skin is oily"), 0.6=implied ("I break out a lot"), 0.3=very vague.
skinConcerns allowed values: ["acne","aging","dullness","hyperpigmentation","dehydration","redness","pores","wrinkles","dark spots","sensitivity"]
Set skinType/hairType to null if not mentioned.`;

function userTable() {
  return (authSchema as any).users || (authSchema as any).user;
}

async function logChange(userId: string, source: string, changes: Record<string, unknown>) {
  try {
    const entry = JSON.stringify({ userId, source, changes, ts: Date.now() });
    await redis.lpush("profile_update_log", entry);
    await redis.ltrim("profile_update_log", 0, 4999);
  } catch {}
}

export async function extractProfileFromMessage(userMessage: string): Promise<ExtractedProfile | null> {
  try {
    const res = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user",   content: `User said: "${userMessage.slice(0, 300)}"` }
      ],
      stream: false,
      options: { temperature: 0.05, num_predict: 120 }
    }, { timeout: 7000 });
    const raw = (res.data?.message?.content ?? "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.confidence !== "number") return null;
    return parsed as ExtractedProfile;
  } catch { return null; }
}

export async function handleProfileUpdate(
  userId: string,
  extracted: ExtractedProfile
): Promise<{ needsConfirmation: boolean; field?: string; oldValue?: string; newValue?: string }> {
  if (!userId || extracted.confidence < 0.35) return { needsConfirmation: false };

  const tbl = userTable();
  if (!tbl) return { needsConfirmation: false };
  const rows = await db.select().from(tbl).where(eq(tbl.id, userId)).limit(1);
  if (!rows.length) return { needsConfirmation: false };
  const u = rows[0] as any;
  const dbSkin = (u.skinType ?? u.skin_type ?? "").toLowerCase() || null;
  const dbHair = (u.hairType ?? u.hair_type ?? "").toLowerCase() || null;

  // ── High confidence → write directly ────────────────────────────────────────
  if (extracted.confidence >= 0.85) {
    const upd: any = {};
    if (extracted.skinType && extracted.skinType !== "null") upd.skinType = extracted.skinType;
    if (extracted.hairType && extracted.hairType !== "null") upd.hairType = extracted.hairType;
    if (extracted.skinConcerns?.length) upd.skinConcerns = extracted.skinConcerns.join(",");
    if (Object.keys(upd).length) {
      await db.update(tbl).set(upd).where(eq(tbl.id, userId));
      await logChange(userId, "chat_direct", upd);
    }
    return { needsConfirmation: false };
  }

  // ── Medium confidence + conflict → ask for confirmation ─────────────────────
  const checkField = async (field: "skinType" | "hairType", newVal: string | null | undefined, dbVal: string | null) => {
    if (!newVal || newVal === "null") return false;
    if (dbVal && dbVal !== newVal.toLowerCase()) {
      await redis.setex(`profile_pending:${userId}`, PENDING_TTL, JSON.stringify({
        field, newValue: newVal, oldValue: dbVal, confidence: extracted.confidence
      }));
      return true;
    }
    // No conflict, fill empty field
    if (!dbVal && extracted.confidence >= 0.6) {
      await db.update(tbl).set({ [field]: newVal } as any).where(eq(tbl.id, userId));
      await logChange(userId, "chat_fill", { [field]: newVal });
    }
    return false;
  };

  if (await checkField("skinType", extracted.skinType, dbSkin)) {
    const p = JSON.parse((await redis.get(`profile_pending:${userId}`))!);
    return { needsConfirmation: true, field: p.field, oldValue: p.oldValue, newValue: p.newValue };
  }
  if (await checkField("hairType", extracted.hairType, dbHair)) {
    const p = JSON.parse((await redis.get(`profile_pending:${userId}`))!);
    return { needsConfirmation: true, field: p.field, oldValue: p.oldValue, newValue: p.newValue };
  }

  // concerns only
  if (extracted.skinConcerns?.length && extracted.confidence >= 0.6) {
    const existing = (u.skinConcerns ?? u.skin_concerns ?? "").split(",").filter(Boolean);
    const merged   = [...new Set([...existing, ...extracted.skinConcerns])].slice(0, 5);
    await db.update(tbl).set({ skinConcerns: merged.join(",") } as any).where(eq(tbl.id, userId));
    await logChange(userId, "chat_concerns", { skinConcerns: merged });
  }
  return { needsConfirmation: false };
}

export async function getPendingConfirmation(userId: string) {
  const raw = await redis.get(`profile_pending:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function resolvePendingConfirmation(userId: string, confirmed: boolean) {
  const raw = await redis.get(`profile_pending:${userId}`);
  if (!raw) return;
  const pending = JSON.parse(raw);
  await redis.del(`profile_pending:${userId}`);
  if (!confirmed) return;
  const tbl = userTable();
  if (tbl) {
    await db.update(tbl).set({ [pending.field]: pending.newValue } as any).where(eq(tbl.id, userId));
    await logChange(userId, "chat_confirmed", { [pending.field]: pending.newValue });
  }
}
'''.lstrip())

# ── 2. Updated ChatController ─────────────────────────────────────────────────
files["src/api/controllers/ChatController.ts"] = textwrap.dedent('''
import { JsonController, Post, Body, Res, CurrentUser, UseBefore } from "routing-controllers";
import { promptInjectionGuard } from "../middlewares/promptInjectionGuard.js";
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
import {
  extractProfileFromMessage,
  handleProfileUpdate,
  getPendingConfirmation,
  resolvePendingConfirmation,
} from "../../infrastructure/services/ProfileIntelligenceService.js";

const OLLAMA_URL       = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\\/$/, "");
const OLLAMA_MODEL     = process.env.OLLAMA_MODEL || "mistral-nemo:12b";
const RAG_URL          = process.env.RAG_URL || "http://localhost:8001";
const SERVICE_TOKEN    = process.env.RASA_SERVICE_TOKEN || "";
const RATE_MAX_MSGS    = 20;
const RATE_WINDOW_SEC  = 60;
const HISTORY_LIMIT    = 3;
const RAG_TIMEOUT      = 5000;
const STREAM_TIMEOUT_MS = 45000;
const SKIN_CACHE_TTL   = 7200;

const BASE_SYSTEM_PROMPT = `You are Lumina, a friendly beauty advisor for Lumina cosmetics.
- CRITICAL: Always respond in the SAME language as the user\\'s message. Never switch languages.
- Keep responses concise (2-4 sentences).
- Only recommend products from the PERMITTED list below, and ONLY when the user explicitly asks. Do NOT proactively suggest products.
- Never mention product names that are not in the list.
- If order info is provided, use it honestly.
- ONLY answer questions about skincare, beauty, or Lumina products. For anything else reply that you can only help with skincare and beauty.`;

function sanitizeForPrompt(text: unknown): string {
  return String(text ?? "").replace(/[\\r\\n\`\\\\]/g, " ").trim();
}
function sanitizeUserMessage(msg: string): string {
  return msg
    .replace(/\\[INST\\]|\\[\\/INST\\]|<<SYS>>|<\\/SYS>|<s>|<\\/s>/gi, "")
    .replace(/^(system|assistant|user)\\s*:/gim, "")
    .replace(/\\s{3,}/g, "  ")
    .trim();
}
function isConfirmation(msg: string): boolean {
  return /^\\s*(yes|yeah|yep|correct|right|exactly|oui|نعم|yup|sure|that\\'s right|confirm|affirmative)\\b/i.test(msg);
}
function isDenial(msg: string): boolean {
  return /^\\s*(no|nope|wrong|incorrect|non|لا|not really|actually no|that\\'s wrong)\\b/i.test(msg);
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

    const sseChunk = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\\n\\n`);
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
      const orderMatch = message.match(/ORD-[\\w\\d-]+/i) || message.match(/\\border\\s+(?:number|#|id)[:\\s]*(\\S+)/i);
      if (orderMatch) {
        const rawId = (orderMatch[1] ?? orderMatch[0]).replace(/\\border\\s+(?:number|#|id)[:\\s]+/i, "").trim();
        try {
          const orderTable = (orderSchema as any).orders || (orderSchema as any).order;
          if (orderTable) {
            const o = await db.select().from(orderTable).where(eq(orderTable.id, rawId)).limit(1);
            const row = o[0] as any;
            orderContext = row
              ? `\\nOrder: ID=${row.id}, Status=${row.status}, Total=${row.totalAmount ?? row.total_amount} TND, Tracking=${row.trackingNumber ?? row.tracking_number ?? "N/A"}`
              : `\\nNo order found with ID '${rawId}'.`;
          }
        } catch { orderContext = "\\nOrder lookup failed. Tell user to contact support."; }
      }

      // ── RAG product context (with auth token) ─────────────────────────────
      let productContext = "";
      try {
        const baseQ    = message.length < 35 && historyMessages.length ? `${historyMessages.at(-2)?.content ?? ""} ${message}` : message;
        const skinHint = [effectiveSkin, effectiveHair, ...effectiveConcerns.slice(0, 2)].filter(Boolean).join(" ");
        const ragQuery = skinHint ? `${baseQ.slice(-200)} ${skinHint}` : baseQ.slice(-200);
        const ragRes   = await axios.get(`${RAG_URL}/search`, {
          params: { q: ragQuery, limit: 6 },
          headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
          timeout: RAG_TIMEOUT
        });
        const products = ragRes.data?.results;
        if (Array.isArray(products) && products.length) {
          productContext = `\\nPERMITTED PRODUCTS (only recommend if asked):\\n` +
            products.map((p: any) => `- ${sanitizeForPrompt(p.name)}: ${sanitizeForPrompt(p.description)} (${p.price} TND)`).join("\\n");
        }
      } catch { console.log("[CHAT] RAG unavailable"); }

      // ── Build system prompt ───────────────────────────────────────────────
      const systemPrompt = [BASE_SYSTEM_PROMPT, profileContext, pendingConfirmationCtx, orderContext, productContext]
        .filter(Boolean).join("\\n");

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
          for (const line of chunk.toString().split("\\n").filter(Boolean)) {
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
          botMessages: [{ text: fullReply }], intent: null,
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
'''.lstrip())

# ── 3. Admin analytics endpoint for profile updates ──────────────────────────
files["src/api/controllers/ProfileAnalyticsController.ts"] = textwrap.dedent('''
import { JsonController, Get, UseBefore } from "routing-controllers";
import { Service } from "typedi";
import { redis } from "../../infrastructure/redis/index.js";
import { requireAdmin } from "../middlewares/authenticationCheckers.js";

@JsonController("/admin/profile-analytics")
@Service()
export class ProfileAnalyticsController {

  @UseBefore(requireAdmin)
  @Get("/updates")
  async getProfileUpdates() {
    try {
      const raw = await redis.lrange("profile_update_log", 0, 499);
      const entries = raw.map((r: string) => {
        try { return JSON.parse(r); } catch { return null; }
      }).filter(Boolean);

      // Aggregate by source
      const bySource: Record<string, number> = {};
      const byField:  Record<string, number> = {};
      for (const e of entries) {
        bySource[e.source] = (bySource[e.source] ?? 0) + 1;
        Object.keys(e.changes ?? {}).forEach(f => { byField[f] = (byField[f] ?? 0) + 1; });
      }

      return { total: entries.length, bySource, byField, recent: entries.slice(0, 20) };
    } catch {
      return { total: 0, bySource: {}, byField: {}, recent: [] };
    }
  }
}
'''.lstrip())

# ── Write files ───────────────────────────────────────────────────────────────
for rel_path, content in files.items():
    full_path = os.path.join(BASE, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote  {full_path}")

print("\nDone. Now run: npm run build (inside PFE2026) to check for TS errors.")
