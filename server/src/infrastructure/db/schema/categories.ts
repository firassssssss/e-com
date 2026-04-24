import { pgTable, varchar, text, timestamp, integer, boolean, AnyPgColumn } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    parentId: varchar('parent_id', { length: 255 }).references((): AnyPgColumn => categories.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
