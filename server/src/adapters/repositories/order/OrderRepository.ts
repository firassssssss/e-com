import { Service } from 'typedi';
import { IOrderRepository } from '../../../core/repositories/IOrderRepository.js';
import { Order } from '../../../core/entities/Order.js';
import { getDb } from '../../../infrastructure/db/index.js';
import { orders } from '../../../infrastructure/db/schema/orders.js';
import { eq, desc } from 'drizzle-orm';
import { OrderMapper } from './mappers/OrderMapper.js';

@Service()
export class OrderRepository implements IOrderRepository {
    async create(order: Order): Promise<Order> {
        const dbOrder = OrderMapper.toPersistence(order);
        const result = await getDb().insert(orders).values(dbOrder).returning();
        return OrderMapper.toDomain(result[0]);
    }

    async findById(id: string): Promise<Order | null> {
        const result = await getDb().select().from(orders).where(eq(orders.id, id));
        return result[0] ? OrderMapper.toDomain(result[0]) : null;
    }

    async findByUserId(userId: string): Promise<Order[]> {
        const result = await getDb()
            .select()
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt));
        return result.map(OrderMapper.toDomain);
    }

    async update(order: Order): Promise<Order> {
        const dbOrder = OrderMapper.toPersistence(order);
        const result = await getDb()
            .update(orders)
            .set(dbOrder)
            .where(eq(orders.id, order.id))
            .returning();
        return OrderMapper.toDomain(result[0]);
    }
}
