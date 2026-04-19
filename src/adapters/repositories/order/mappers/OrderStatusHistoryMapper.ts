import { OrderStatusHistory } from '../../../../core/entities/OrderStatusHistory.js';
import { orderStatusHistory } from '../../../../infrastructure/db/schema/order_status_history.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbStatusHistory = InferSelectModel<typeof orderStatusHistory>;
type NewDbStatusHistory = InferInsertModel<typeof orderStatusHistory>;

export class OrderStatusHistoryMapper {
    static toDomain(db: DbStatusHistory): OrderStatusHistory {
        return new OrderStatusHistory(
            db.id,
            db.orderId,
            db.fromStatus,
            db.toStatus,
            db.comment,
            db.changedBy,
            db.trackingNumber,
            db.estimatedDeliveryDate,
            db.createdAt
        );
    }

    static toPersistence(domain: OrderStatusHistory): NewDbStatusHistory {
        return {
            id: domain.id,
            orderId: domain.orderId,
            fromStatus: domain.fromStatus,
            toStatus: domain.toStatus,
            comment: domain.comment || null,
            changedBy: domain.changedBy || null,
            trackingNumber: domain.trackingNumber || null,
            estimatedDeliveryDate: domain.estimatedDeliveryDate,
            createdAt: domain.createdAt
        };
    }
}
