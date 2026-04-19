import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { v4 } from "uuid";
export const conversationLogs = pgTable("conversation_logs", {
  id:          text("id").primaryKey().$default(() => v4()),
  sessionId:   text("session_id").notNull(),
  userId:      text("user_id"),
  userMessage: text("user_message").notNull(),
  botMessages: jsonb("bot_messages").notNull(),
  intent:      text("intent"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
