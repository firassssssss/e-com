import { Controller, Post, Body, HttpCode } from "routing-controllers";
import { Service } from "typedi";
import { db } from "../../infrastructure/db/index.js";
import { chatFeedback } from "../../infrastructure/db/schema/chatFeedback.js";

class ChatFeedbackDto {
  logId!:     string;
  sessionId!: string;
  rating!:    number;
}

@Controller("/chat")
@Service()
export class ChatFeedbackController {
  @Post("/feedback")
  @HttpCode(201)
  async feedback(@Body() body: ChatFeedbackDto) {
    if (!body.logId || !body.sessionId) {
      throw new Error("logId and sessionId are required.");
    }
    if (body.rating !== 1 && body.rating !== -1) {
      throw new Error("rating must be 1 or -1.");
    }
    await db.insert(chatFeedback).values({
      logId:     body.logId,
      sessionId: body.sessionId,
      rating:    body.rating,
    });
    return { success: true };
  }
}
