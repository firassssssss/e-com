// src/api/controllers/ChatFeedbackController.ts
// LACUNA PFE 2026 — thumbs up/down feedback endpoint
// POST /api/chat/feedback  { logId, sessionId, rating: 1 | -1 }

import { Request, Response } from "express";
import { db } from "../../infrastructure/db/index";
import { chatFeedback } from "../../infrastructure/db/schema/chatFeedback";

export async function submitFeedback(req: Request, res: Response): Promise<void> {
  const { logId, sessionId, rating } = req.body as {
    logId:     string;
    sessionId: string;
    rating:    number;
  };

  if (!logId || !sessionId) {
    res.status(400).json({ error: "logId and sessionId are required" });
    return;
  }

  if (rating !== 1 && rating !== -1) {
    res.status(400).json({ error: "rating must be 1 (thumbs up) or -1 (thumbs down)" });
    return;
  }

  await db.insert(chatFeedback).values({
    logId,
    sessionId,
    rating,
  });

  res.status(201).json({ success: true });
}
