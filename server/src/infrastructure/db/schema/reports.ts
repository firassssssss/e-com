import { pgEnum, pgTable, uuid, jsonb, timestamp, index, text } from "drizzle-orm/pg-core";
import { user } from './auth';
import { v4 } from "uuid";

export const reportTargetTypeEnum = pgEnum('report_target_type', ['user', 'offer']);

export const report = pgTable('reports', {
    id: text().$default(() => v4()).primaryKey(),
    reporterUserId: text().references(() => user.id, { onDelete: 'cascade' }).notNull(),
    targetType: reportTargetTypeEnum().notNull(),
    targetId: text().notNull(),
    data: jsonb().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
}, (table) => {
    return [
        index('reports_reporter_idx').on(table.reporterUserId),
        index('reports_target_idx').on(table.targetType, table.targetId),
    ];
});
