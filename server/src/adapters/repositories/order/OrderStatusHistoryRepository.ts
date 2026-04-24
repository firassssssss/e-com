import { Service } from 'typedi';
import { IOrderStatusHistoryRepository } from '../../../core/repositories/IOrderStatusHistoryRepository.js';
import { OrderStatusHistory } from '../../../core/entities/OrderStatusHistory.js';
import { db } from '../../../infrastructure/db/index.js';
import { orderStatusHistory } from '../../../infrastructure/db/schema/order_status_history.js';
import { eq, desc } from 'drizzle-orm';
import { OrderStatusHistoryMapper } from './mappers/OrderStatusHistoryMapper.js';

@Service()
export class OrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
    async findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
        const result = await db
            .select()
            .from(orderStatusHistory)
            .where(eq(orderStatusHistory.orderId, orderId))
            .orderBy(desc(orderStatusHistory.createdAt));

        return result.map(OrderStatusHistoryMapper.toDomain);
    }

    async create(history: OrderStatusHistory): Promise<OrderStatusHistory> {
        const dbHistory = OrderStatusHistoryMapper.toPersistence(history);
        const result = await db.insert(orderStatusHistory).values(dbHistory).returning();
        return OrderStatusHistoryMapper.toDomain(result[0]);
    }

    async getLatestStatus(orderId: string): Promise<OrderStatusHistory | null> {
        const result = await db
            .select()
            .from(orderStatusHistory)
            .where(eq(orderStatusHistory.orderId, orderId))
            .orderBy(desc(orderStatusHistory.createdAt))
            .limit(1);

        return result[0] ? OrderStatusHistoryMapper.toDomain(result[0]) : null;
    }
}
