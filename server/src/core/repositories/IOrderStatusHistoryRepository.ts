import { OrderStatusHistory } from '../entities/OrderStatusHistory.js';

export interface IOrderStatusHistoryRepository {
    findByOrderId(orderId: string): Promise<OrderStatusHistory[]>;
    create(history: OrderStatusHistory): Promise<OrderStatusHistory>;
    getLatestStatus(orderId: string): Promise<OrderStatusHistory | null>;
}
