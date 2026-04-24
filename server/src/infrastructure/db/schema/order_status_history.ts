import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders.js';

export const orderStatusHistory = pgTable('order_status_history', {
    id: varchar('id', { length: 255 }).primaryKey(),
    orderId: varchar('order_id', { length: 255 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),

    fromStatus: varchar('from_status', { length: 50 }),
    toStatus: varchar('to_status', { length: 50 }).notNull(),

    comment: text('comment'),
    changedBy: varchar('changed_by', { length: 255 }), // User ID (admin/system)

    trackingNumber: varchar('tracking_number', { length: 255 }),
    estimatedDeliveryDate: timestamp('estimated_delivery_date'),

    createdAt: timestamp('created_at').notNull().defaultNow()
});
