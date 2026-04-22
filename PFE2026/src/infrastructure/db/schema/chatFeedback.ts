import { pgTable, text, timestamp, smallint } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';
import { conversationLogs } from './conversationLogs';

export const chatFeedback = pgTable('chat_feedback', {
  id:        text('id').primaryKey().$defaultFn(() => randomUUID()),
  logId:     text('log_id').references(() => conversationLogs.id, { onDelete: 'cascade' }).notNull(),
  sessionId: text('session_id').notNull(),
  rating:    smallint('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
