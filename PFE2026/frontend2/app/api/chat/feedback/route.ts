import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.EXPRESS_API_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body     = await request.json();
    const upstream = await fetch(`${EXPRESS_URL}/api/chat/feedback`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Feedback service unavailable" }, { status: 503 });
  }
}
