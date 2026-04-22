// src/api/controllers/ChatController.ts
// LACUNA PFE 2026 — 9-step SSE orchestration engine
// ===================================================
// Step 1  SSE headers + stream open
// Step 2  Redis rate limit (20 msg/60s per session)
// Step 3  PostgreSQL conversation history (last 3 turns)
// Step 4  Skin profile (DB + Redis cache + current message extraction)
// Step 5  Order lookup (regex detect → raw SQL)
// Step 6  RAG query (FastAPI :8001, 5s timeout)
// Step 7  System prompt assembly
// Step 8  Ollama streaming (mistral-nemo:12b, 45s timeout)
// Step 9  DB log + done signal with logId

import crypto from "crypto";
import { Request, Response } from "express";
import axios from "axios";
import { eq, desc } from "drizzle-orm";
import { sql as drizzleSql } from "drizzle-orm";
import { db } from "../../infrastructure/db/index";
import { conversationLogs } from "../../infrastructure/db/schema/conversationLogs";
import { users } from "../../infrastructure/db/schema/auth";
import { redis } from "../../infrastructure/redis/index";
import { logger } from "../../adapters/services/LoggerFactory";

// ── Constants ─────────────────────────────────────────────────────────────────
const OLLAMA_URL        = process.env.OLLAMA_URL    || "http://localhost:11434";
const OLLAMA_MODEL      = process.env.OLLAMA_MODEL  || "mistral-nemo:12b";
const RAG_URL           = process.env.RAG_URL       || "http://localhost:8001";
const RAG_TIMEOUT       = 5_000;
const HISTORY_LIMIT     = 3;
const STREAM_TIMEOUT_MS = 45_000;
const SKIN_CACHE_TTL    = 7_200;   // 2 hours
const RATE_WINDOW_SEC   = 60;
const RATE_MAX_MSGS     = 20;
const MAX_MSG_LENGTH    = 500;

// ── Skin extraction ───────────────────────────────────────────────────────────
const SKIN_TYPE_RE    = /\b(oily|dry|combination|normal|sensitive|mixed)\b/i;
const SKIN_CONCERN_KW = [
  "acne","redness","dark spots","hyperpigmentation","aging","wrinkles",
  "dehydration","dehydrated","dullness","dull","pores","blackheads",
  "texture","barrier","blemish","breakout","uneven",
];

function extractSkinSignals(message: string) {
  const typeMatch = message.match(SKIN_TYPE_RE);
  const type      = typeMatch ? typeMatch[1].toLowerCase() : null;
  const concerns  = SKIN_CONCERN_KW.filter((kw) =>
    message.toLowerCase().includes(kw)
  );
  return { type, concerns };
}

// ── Prompt sanitiser ──────────────────────────────────────────────────────────
function sanitizeForPrompt(text: unknown): string {
  return String(text ?? "").replace(/[\r\n`\\]/g, " ").trim();
}

// ── SSE helper ────────────────────────────────────────────────────────────────
function sseChunk(res: Response, payload: object) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// ── Base system prompt (constant) ─────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Lumière, a friendly and knowledgeable beauty advisor for LACUNA cosmetics.

PRODUCT RULES:
- Only recommend products from the PERMITTED PRODUCT NAMES list in your context.
- If the list says ZERO RESULTS — you are FORBIDDEN from naming any product.
- If the list says UNAVAILABLE — give general skincare advice only, no product names.
- Never invent product names, prices, or ingredients.

TONE: Warm, professional, concise. Maximum 3 product recommendations per response.

CLARIFICATION RULE: If the user's skin type or concern is unclear, ask ONE clarifying question before recommending.

ROUTINE RULE: When building a routine, list steps in order: cleanser → toner → serum → moisturiser → SPF.

ORDER TRACKING RULE: You have ZERO order data unless an 'Order found:' block appears in this prompt. Never hallucinate order details.

FACTS RULE: Do not make claims about ingredients unless they appear in the product context provided.

IDENTITY RULE: You are an AI beauty advisor. Do not claim to be human.`;

// ── Health check (first request only) ────────────────────────────────────────
let ragHealthChecked = false;
async function checkRagHealth() {
  if (ragHealthChecked) return;
  try {
    await axios.get(`${RAG_URL}/health`, { timeout: 2_000 });
    ragHealthChecked = true;
  } catch {
    logger.warn("[Chat] RAG service not reachable at startup");
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function sendMessage(req: Request, res: Response): Promise<Response> {
  const { message, sessionId, userId } = req.body as {
    message:   string;
    sessionId: string;
    userId?:   string;
  };

  const sender          = sessionId;
  const resolvedUserId  = userId ?? null;
  let   clientGone      = false;
  let   fullReply       = "";

  // ── STEP 1 — SSE headers ──────────────────────────────────────────────────
  res.setHeader("Content-Type",     "text/event-stream");
  res.setHeader("Cache-Control",    "no-cache");
  res.setHeader("Connection",       "keep-alive");
  res.setHeader("X-Accel-Buffering","no");
  res.flushHeaders();

  res.on("close", () => { clientGone = true; });

  checkRagHealth(); // non-blocking

  try {
    // ── STEP 2 — Rate limit ─────────────────────────────────────────────────
    try {
      const rateKey  = `chat_rate:${sender}`;
      const msgCount = await redis.incr(rateKey);
      if (msgCount === 1) await redis.expire(rateKey, RATE_WINDOW_SEC);
      if (msgCount > RATE_MAX_MSGS) {
        sseChunk(res, { error: "Slow down! You've sent too many messages. Please wait a minute." });
        return res.end();
      }
    } catch { /* Redis down — silent pass-through */ }

    // ── STEP 3 — Conversation history ───────────────────────────────────────
    let historyMessages: { role: string; content: string }[] = [];
    try {
      const rawHistory = await db
        .select()
        .from(conversationLogs)
        .where(eq(conversationLogs.sessionId, sender))
        .orderBy(desc(conversationLogs.createdAt))
        .limit(HISTORY_LIMIT);

      rawHistory.reverse();

      for (const turn of rawHistory) {
        const botText = (turn.botMessages as { text: string }[])[0]?.text ?? "";
        if (!turn.userMessage || !botText) continue;
        historyMessages.push({ role: "user",      content: turn.userMessage });
        historyMessages.push({ role: "assistant", content: botText });
      }
    } catch (err) {
      logger.warn("[Chat] History load failed:", err);
    }

    // ── STEP 4 — Skin profile ───────────────────────────────────────────────
    let dbSkinType:    string | null = null;
    let dbSkinConcern: string | null = null;

    if (resolvedUserId) {
      try {
        const userRows = await db
          .select({ skin_type: users.skinType, skin_concern: users.skinConcern })
          .from(users)
          .where(eq(users.id, resolvedUserId))
          .limit(1);
        if (userRows[0]) {
          dbSkinType    = userRows[0].skin_type    ?? null;
          dbSkinConcern = userRows[0].skin_concern ?? null;
        }
      } catch { /* no skin columns yet — skip */ }
    }

    let sessionSkin: { type: string | null; concerns: string[] } = { type: null, concerns: [] };
    try {
      const cached = await redis.get(`skin:${sender}`);
      if (cached) sessionSkin = JSON.parse(cached);
    } catch { /* Redis down */ }

    const signals     = extractSkinSignals(message);
    let   updatedSkin = sessionSkin;

    if (signals.type && sessionSkin.type && signals.type !== sessionSkin.type) {
      updatedSkin = { type: signals.type, concerns: signals.concerns };
    } else {
      updatedSkin = {
        type:     signals.type ?? sessionSkin.type ?? dbSkinType ?? null,
        concerns: [...new Set([
          ...signals.concerns,
          ...sessionSkin.concerns,
          ...(dbSkinConcern ? [dbSkinConcern] : []),
        ])].slice(0, 5),
      };
    }

    try {
      await redis.setEx(`skin:${sender}`, SKIN_CACHE_TTL, JSON.stringify(updatedSkin));
    } catch { /* Redis down */ }

    // ── STEP 5 — Order lookup ───────────────────────────────────────────────
    let orderContext = "";
    const orderId =
      message.match(/ORD-[\w\d-]+/i)?.[0] ??
      message.match(/\border\s+(?:number|#|id)[:\s]+(\d{3,})/i)?.[1] ??
      null;

    if (orderId) {
      try {
        const rows = await db.execute(drizzleSql`
          SELECT id, status, total_amount::float AS total,
                 created_at, tracking_number
          FROM   orders
          WHERE  id = ${orderId}
          OR     id::text ILIKE ${"%" + orderId + "%"}
          LIMIT  1
        `);
        const o = (rows as any[])[0];
        if (o) {
          orderContext = `\nOrder found:\n- ID: ${o.id}\n- Status: ${o.status}\n- Total: ${o.total} TND\n- Tracking: ${o.tracking_number ?? "N/A"}`;
        } else {
          orderContext = `\nOrder lookup: No order found with ID '${orderId}'. Tell the user honestly and ask them to double-check.`;
        }
      } catch {
        orderContext = "\nOrder lookup failed. Tell the user to contact support with their order number.";
      }
    }

    // ── STEP 6 — RAG query ─────────────────────────────────────────────────
    const lastUserMsg  = historyMessages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const isVague      = message.trim().length < 35;
    const baseQuery    = isVague && lastUserMsg ? `${lastUserMsg} ${message.trim()}` : message.trim();
    const trimmedQuery = baseQuery.length > 200 ? baseQuery.slice(-200) : baseQuery;
    const skinHint     = [updatedSkin.type, ...updatedSkin.concerns.slice(0, 2)].filter(Boolean).join(" ");
    const ragQuery     = skinHint ? `${trimmedQuery} ${skinHint}` : trimmedQuery;

    const isMulti  = /routine|compar|vs\b|versus|both|recommend.*and/i.test(message);
    const ragLimit = isMulti ? 6 : 4;

    let productContext = "\nPRODUCT CONTEXT: UNAVAILABLE — give general skincare advice only, do not name products.";

    try {
      const ragRes = await axios.get(`${RAG_URL}/search`, {
        params:  { q: ragQuery, limit: ragLimit },
        timeout: RAG_TIMEOUT,
        headers: { Authorization: `Bearer ${process.env.RASA_SERVICE_TOKEN ?? ""}` },
      });

      const results: any[] = Array.isArray(ragRes.data?.results) ? ragRes.data.results : [];
      const hasOosFallback: boolean = ragRes.data?.has_oos_fallback ?? false;

      if (results.length === 0) {
        productContext = "\nPRODUCT CONTEXT: ZERO RESULTS — you are FORBIDDEN from naming any product. Give general advice only.";
      } else {
        const lines = results.map((p: any, i: number) => {
          const name    = sanitizeForPrompt(p.name);
          const brand   = sanitizeForPrompt(p.brand);
          const price   = sanitizeForPrompt(p.price);
          const concern = sanitizeForPrompt(p.concern ?? p.skin_concern ?? "");
          const rating  = p.avg_rating ? `⭐ ${Number(p.avg_rating).toFixed(1)}` : "";
          return `${i + 1}. ${name} by ${brand} — ${price} TND  ${rating}  [${concern}]`;
        });
        productContext = `\nPERMITTED PRODUCT NAMES (only recommend from this list):\n${lines.join("\n")}`;
        if (hasOosFallback) {
          productContext += "\n⚠ Some products shown may be low in stock. Mention availability may vary.";
        }
      }
    } catch { /* RAG timeout or down — productContext stays UNAVAILABLE */ }

    // ── STEP 7 — System prompt assembly ────────────────────────────────────
    let systemPrompt = BASE_SYSTEM_PROMPT;

    // Language detection
    const isArabic  = /[\u0600-\u06FF]/.test(message);
    const isFrench  = /\b(je|tu|vous|nous|bonjour|merci|mon|ma|les|des|pour|avec|est|une|sur)\b/i.test(message);
    if (isArabic) {
      systemPrompt += "\n\n■ LANGUAGE OVERRIDE — MANDATORY: Respond ENTIRELY in Arabic. Do not use any other language.";
    } else if (isFrench) {
      systemPrompt += "\n\n■ LANGUAGE OVERRIDE — MANDATORY: Respond ENTIRELY in French. Do not use any other language.";
    } else {
      systemPrompt += "\n\n■ LANGUAGE OVERRIDE — MANDATORY: Respond in English.";
    }

    // Skin profile
    if (updatedSkin.type || updatedSkin.concerns.length > 0) {
      systemPrompt += `\n\nUser skin profile (remembered):\n- Skin type: ${updatedSkin.type ?? "unknown"}\n- Concerns: ${updatedSkin.concerns.join(", ") || "none"}`;
    }

    // Order context
    if (orderContext) systemPrompt += orderContext;

    // Product context (always last — closest to user message = highest attention)
    systemPrompt += productContext;

    // ── STEP 8 — Ollama streaming ───────────────────────────────────────────
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message.trim() },
    ];

    const ollamaRes = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      { model: OLLAMA_MODEL, messages: ollamaMessages, stream: true },
      { responseType: "stream", timeout: 10_000 }  // connection timeout only
    );

    // Abort Ollama if client disconnects
    res.on("close", () => {
      try { ollamaRes.data.destroy(); } catch { /* already closed */ }
    });

    await new Promise<void>((resolve, reject) => {
      const streamTimer = setTimeout(
        () => reject(new Error("Ollama stream timed out after 45s")),
        STREAM_TIMEOUT_MS
      );

      ollamaRes.data.on("data", (chunk: Buffer) => {
        if (clientGone) return;
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token  = parsed?.message?.content ?? "";
            if (token) {
              fullReply += token;
              sseChunk(res, { token });
            }
            if (parsed.done) { clearTimeout(streamTimer); resolve(); }
          } catch { /* malformed chunk — skip */ }
        }
      });

      ollamaRes.data.on("end",   () => { clearTimeout(streamTimer); resolve(); });
      ollamaRes.data.on("error", (err: Error) => { clearTimeout(streamTimer); reject(err); });
    });

    if (clientGone) return res;

    // ── STEP 9 — DB log + done signal ──────────────────────────────────────
    let logId: string | null = null;
    if (fullReply) {
      try {
        const [inserted] = await db
          .insert(conversationLogs)
          .values({
            sessionId:   sender,
            userId:      resolvedUserId,
            userMessage: message.trim(),
            botMessages: [{ text: fullReply }],
            intent:      null,
          })
          .returning({ id: conversationLogs.id });
        logId = inserted?.id ?? null;
      } catch (err) {
        logger.error("[Chat] DB insert failed:", err);
      }
    }

    sseChunk(res, { done: true, logId: logId ?? crypto.randomUUID() });
    return res.end();

  } catch (err: any) {
    logger.error("[Chat] Pipeline error:", err?.message);
    if (!clientGone) {
      try {
        sseChunk(res, { error: "I'm having trouble right now. Please try again in a moment." });
      } catch { /* stream may already be closed */ }
    }
    return res.end();
  }
}
