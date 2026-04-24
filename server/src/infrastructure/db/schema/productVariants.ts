import { pgTable, varchar, decimal, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';

export const productVariants = pgTable('product_variants', {
    id: varchar('id', { length: 255 }).primaryKey(),
    productId: varchar('product_id', { length: 255 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(), // e.g., "50ml - Rose Scent"

    // Variant attributes (size, color, scent, etc.)
    attributes: jsonb('attributes').$type<{
        size?: string;      // e.g., "50ml", "100ml", "200ml"
        color?: string;     // e.g., "Red", "Pink", "Nude"
        scent?: string;     // e.g., "Rose", "Lavender", "Unscented"
        formulation?: string; // e.g., "Dry Hair", "Oily Hair", "Normal Hair"
        [key: string]: string | undefined;
    }>().notNull(),

    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }), // Original price (for discounts)
    stock: integer('stock').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(10),

    images: jsonb('images').$type<string[]>().notNull().default([]), // Variant-specific images

    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false), // One variant is default

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
