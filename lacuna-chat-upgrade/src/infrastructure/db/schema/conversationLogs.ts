// src/infrastructure/db/schema/conversationLogs.ts
// LACUNA PFE 2026

import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { v4 } from "uuid";
import { users } from "./auth";

export const conversationLogs = pgTable("conversation_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v4()),

  sessionId: text("session_id").notNull(),

  // NULL for anonymous sessions
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

  userMessage: text("user_message").notNull(),

  // JSONB array: [{ text: "..." }]  — supports multiple bot messages in future
  botMessages: jsonb("bot_messages").notNull().$type<{ text: string }[]>(),

  // Reserved for future NLU classification — always null currently
  intent: text("intent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes needed (add to migration):
// CREATE INDEX idx_conv_logs_session  ON conversation_logs(session_id);
// CREATE INDEX idx_conv_logs_user     ON conversation_logs(user_id);
// CREATE INDEX idx_conv_logs_created  ON conversation_logs(created_at DESC);
