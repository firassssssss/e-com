import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { products } from './products';

export const wishlists = pgTable('wishlists', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), //.references(() => users.id),
    name: varchar('name', { length: 255 }).notNull().default('My Wishlist'),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const wishlistItems = pgTable('wishlist_items', {
    id: varchar('id', { length: 255 }).primaryKey(),
    wishlistId: varchar('wishlist_id', { length: 255 }).notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 255 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow()
});
