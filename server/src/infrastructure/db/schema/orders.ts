import { pgTable, varchar, decimal, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { OrderItem } from '../../../core/entities/Order';

export const orders = pgTable('orders', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
    items: jsonb('items').$type<OrderItem[]>().notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    shippingAddress: text('shipping_address').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    trackingNumber: varchar('tracking_number', { length: 255 }),
    estimatedDeliveryDate: timestamp('estimated_delivery_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});
