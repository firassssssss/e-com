import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { products } from './products';
// import { users } from './users'; // Assuming users table exists, but avoiding circular dep if not needed for constraints. 
// Ideally we reference users.id but for MVP/schema stability we can enforce in app logic or add raw reference.
// The boilerplate likely has a users table. Let's check imports if needed, but for now just varchar.

export const reviews = pgTable('reviews', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Foreign key to users
    productId: varchar('product_id', { length: 255 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    images: jsonb('images').$type<string[]>().notNull().default([]),

    isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
    isApproved: boolean('is_approved').notNull().default(true),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
