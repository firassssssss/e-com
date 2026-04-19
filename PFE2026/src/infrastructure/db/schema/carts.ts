import { pgTable, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { CartItem } from '../../../core/entities/Cart';

export const carts = pgTable('carts', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
    items: jsonb('items').$type<CartItem[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
