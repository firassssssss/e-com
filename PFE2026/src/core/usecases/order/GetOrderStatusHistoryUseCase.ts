import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { OrderStatusHistory } from '../../entities/OrderStatusHistory.js';
import { IOrderStatusHistoryRepository } from '../../repositories/IOrderStatusHistoryRepository.js';

export interface IGetOrderStatusHistoryUseCase {
    execute(orderId: string): Promise<Result<OrderStatusHistory[]>>;
}

@Service()
export class GetOrderStatusHistoryUseCase implements IGetOrderStatusHistoryUseCase {
    constructor(
        @Inject('IOrderStatusHistoryRepository') private historyRepository: IOrderStatusHistoryRepository
    ) { }

    async execute(orderId: string): Promise<Result<OrderStatusHistory[]>> {
        try {
            const history = await this.historyRepository.findByOrderId(orderId);
            return ResultHelper.success(history);
        } catch (error) {
            console.error('[GetOrderStatusHistoryUseCase] Error:', error);
            return ResultHelper.failure('Failed to fetch order status history', ErrorCode.INTERNAL_ERROR);
        }
    }
}
