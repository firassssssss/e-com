import { Order, OrderItem, OrderStatus } from '../../../../core/entities/Order.js';
import { orders } from '../../../../infrastructure/db/schema/orders.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbOrder = InferSelectModel<typeof orders>;
type NewDbOrder = InferInsertModel<typeof orders>;

export class OrderMapper {
    static toDomain(dbOrder: DbOrder): Order {
        return new Order(
            dbOrder.id,
            dbOrder.userId,
            (dbOrder.items as OrderItem[]) || [],
            Number(dbOrder.totalAmount),
            dbOrder.status as OrderStatus,
            dbOrder.shippingAddress,
            dbOrder.paymentMethod,
            dbOrder.stripePaymentIntentId || undefined,
            dbOrder.trackingNumber || undefined,
            dbOrder.estimatedDeliveryDate || undefined,
            dbOrder.createdAt,
            dbOrder.updatedAt
        );
    }

    static toPersistence(order: Order): NewDbOrder {
        return {
            id: order.id,
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount.toString(),
            status: order.status,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            stripePaymentIntentId: order.stripePaymentIntentId || null,
            trackingNumber: order.trackingNumber || null,
            estimatedDeliveryDate: order.estimatedDeliveryDate || null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
}
