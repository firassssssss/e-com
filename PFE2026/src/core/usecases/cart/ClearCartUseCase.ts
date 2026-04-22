import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { ICartRepository } from '../../repositories/ICartRepository.js';

export interface ClearCartInput {
    userId: string;
}

export interface IClearCartUseCase {
    execute(input: ClearCartInput): Promise<Result<void>>;
}

@Service()
export class ClearCartUseCase implements IClearCartUseCase {
    constructor(
        @Inject('ICartRepository') private cartRepository: ICartRepository
    ) { }

    async execute(input: ClearCartInput): Promise<Result<void>> {
        await this.cartRepository.clearCart(input.userId);
        return ResultHelper.success(undefined);
    }
}
