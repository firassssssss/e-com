import { pgTable, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { v4 } from 'uuid';

export const userSignals = pgTable('user_signals', {
  id: text('id').primaryKey().$default(() => v4()),
  userId: text('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // view, search, cart, wishlist
  productId: varchar('product_id', { length: 255 }),
  searchQuery: text('search_query'),
  weight: integer('weight').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});