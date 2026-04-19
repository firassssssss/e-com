import { Order } from '../entities/Order.js';

export interface IOrderRepository {
    create(order: Order): Promise<Order>;
    findById(id: string): Promise<Order | null>;
    findByUserId(userId: string): Promise<Order[]>;
    update(order: Order): Promise<Order>;
}
