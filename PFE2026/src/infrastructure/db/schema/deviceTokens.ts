import { pgTable, varchar, timestamp, uniqueIndex, text } from "drizzle-orm/pg-core";
import { user } from './auth';
import { v4 } from "uuid";

export const deviceToken = pgTable('device_tokens', {
    id: text().$default(() => v4()).primaryKey(),
    userId: text().references(() => user.id, { onDelete: 'cascade' }).notNull(),
    token: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
}, (table) => {
    return [uniqueIndex('device_tokens_token_uq').on(table.token)];
});
