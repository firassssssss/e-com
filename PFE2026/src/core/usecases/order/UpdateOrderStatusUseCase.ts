import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Order, OrderStatus } from '../../entities/Order.js';
import { OrderStatusHistory } from '../../entities/OrderStatusHistory.js';
import { IOrderRepository } from '../../repositories/IOrderRepository.js';
import { IOrderStatusHistoryRepository } from '../../repositories/IOrderStatusHistoryRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface UpdateOrderStatusInput {
    orderId: string;
    newStatus: OrderStatus;
    comment?: string;
    changedBy?: string;
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
}

export interface IUpdateOrderStatusUseCase {
    execute(input: UpdateOrderStatusInput): Promise<Result<Order>>;
}

@Service()
export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
    constructor(
        @Inject('IOrderRepository') private orderRepository: IOrderRepository,
        @Inject('IOrderStatusHistoryRepository') private historyRepository: IOrderStatusHistoryRepository
    ) { }

    async execute(input: UpdateOrderStatusInput): Promise<Result<Order>> {
        try {
            const order = await this.orderRepository.findById(input.orderId);
            if (!order) {
                return ResultHelper.failure('Order not found', ErrorCode.NOT_FOUND);
            }

            const previousStatus = order.status;

            // 1. Update order
            order.status = input.newStatus;
            if (input.trackingNumber) order.trackingNumber = input.trackingNumber;
            if (input.estimatedDeliveryDate) order.estimatedDeliveryDate = input.estimatedDeliveryDate;
            order.updatedAt = new Date();

            const updatedOrder = await this.orderRepository.update(order);
            // Wait, usually repositories have update. Let me check IOrderRepository.

            // 2. Create history entry
            const history = new OrderStatusHistory(
                uuidv4(),
                order.id,
                previousStatus,
                input.newStatus,
                input.comment || null,
                input.changedBy || 'system',
                input.trackingNumber || order.trackingNumber || null,
                input.estimatedDeliveryDate || order.estimatedDeliveryDate || null,
                new Date()
            );

            await this.historyRepository.create(history);

            console.log(`[UpdateOrderStatusUseCase] Order ${order.id} status updated from ${previousStatus} to ${input.newStatus}`);

            return ResultHelper.success(updatedOrder);
        } catch (error) {
            console.error('[UpdateOrderStatusUseCase] Error:', error);
            return ResultHelper.failure('Failed to update order status', ErrorCode.INTERNAL_ERROR);
        }
    }
}
