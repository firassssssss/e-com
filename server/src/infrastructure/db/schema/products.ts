import { pgTable, varchar, text, decimal, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { v4 } from 'uuid';

export const products = pgTable('products', {
    id: varchar('id', { length: 255 }).primaryKey().$default(() => v4()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }), // Nullable now
    categoryId: varchar('category_id', { length: 255 }).notNull(), // Assuming categories table exists or will exist. For now just a string ID.
    brand: varchar('brand', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    stock: integer('stock').default(0), // Nullable now
    images: jsonb('images').$type<string[]>().notNull().default([]), // Storing as array of strings (URLs)
    ingredients: jsonb('ingredients').$type<string[]>(),
    skinType: jsonb('skin_type').$type<string[]>(),

    isActive: boolean('is_active').default(true).notNull(),

    // New fields
    hasVariants: boolean('has_variants').notNull().default(false),
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
    reviewCount: integer('review_count').notNull().default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
