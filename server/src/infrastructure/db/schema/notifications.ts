import { pgTable, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from './auth';
import { v4 } from "uuid";

export const notification = pgTable('notifications', {
    id: text().$default(() => v4()).primaryKey(),
    userId: text().references(() => user.id, { onDelete: 'cascade' }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    title: varchar({ length: 100 }).notNull(),
    body: text().notNull(),
    data: text(), // JSON stringified payload
    read: boolean().default(false).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
}, (table) => {
    return [index('notifications_user_idx').on(table.userId)];
});
