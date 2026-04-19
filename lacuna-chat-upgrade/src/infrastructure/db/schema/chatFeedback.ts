// src/infrastructure/db/schema/chatFeedback.ts
// LACUNA PFE 2026

import { pgTable, text, smallint, timestamp } from "drizzle-orm/pg-core";
import { v4 } from "uuid";
import { conversationLogs } from "./conversationLogs";

export const chatFeedback = pgTable("chat_feedback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v4()),

  // FK → conversation_logs.id — cascade delete when log is removed
  logId: text("log_id")
    .references(() => conversationLogs.id, { onDelete: "cascade" })
    .notNull(),

  // Denormalised — allows feedback queries without join
  sessionId: text("session_id").notNull(),

  // 1 = 👍  -1 = 👎
  rating: smallint("rating").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes needed (add to migration):
// CREATE INDEX idx_feedback_log_id    ON chat_feedback(log_id);
// CREATE INDEX idx_feedback_session   ON chat_feedback(session_id);
// CREATE INDEX idx_feedback_created   ON chat_feedback(created_at DESC);

// ── Analytics queries ─────────────────────────────────────────────────────────
//
// Negative feedback rate by day:
// SELECT DATE(cf.created_at),
//        COUNT(*) FILTER (WHERE rating=-1)::float / COUNT(*) AS neg_rate
// FROM chat_feedback cf GROUP BY 1 ORDER BY 1 DESC;
//
// Which messages got thumbs down:
// SELECT cl.user_message, cl.bot_messages, cf.rating, cf.created_at
// FROM chat_feedback cf
// JOIN conversation_logs cl ON cf.log_id = cl.id
// WHERE cf.rating = -1
// ORDER BY cf.created_at DESC LIMIT 50;
