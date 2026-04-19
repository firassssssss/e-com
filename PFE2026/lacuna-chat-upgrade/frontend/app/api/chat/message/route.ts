// frontend/app/api/chat/message/route.ts
// LACUNA PFE 2026 — Next.js SSE proxy
// =====================================
// Validates input → forwards to Express → pipes ReadableStream back.
// Never buffers the full response — zero memory overhead.

import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL   = process.env.EXPRESS_API_URL || "http://localhost:3000";
const MAX_MSG_LENGTH = 500;

export async function POST(req: NextRequest) {
  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { message?: unknown; sessionId?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (body.message.length > MAX_MSG_LENGTH) {
    return NextResponse.json(
      { error: `Message too long. Maximum ${MAX_MSG_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // ── Forward to Express ─────────────────────────────────────────────────────
  try {
    const upstream = await fetch(`${EXPRESS_URL}/api/chat/message`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        message:   body.message,
        sessionId: body.sessionId,
        userId:    body.userId ?? null,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Chat service unavailable. Please try again." },
        { status: 503 }
      );
    }

    // ── Pipe SSE stream directly — zero buffering ──────────────────────────
    return new NextResponse(upstream.body, {
      status:  200,
      headers: {
        "Content-Type":     "text/event-stream",
        "Cache-Control":    "no-cache",
        "Connection":       "keep-alive",
        "X-Accel-Buffering":"no",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Chat service unreachable. Please try again." },
      { status: 503 }
    );
  }
}
