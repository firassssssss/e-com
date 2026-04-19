import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Cart } from '../../entities/Cart.js';
import { ICartRepository } from '../../repositories/ICartRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface GetCartInput {
    userId: string;
}

export interface IGetCartUseCase {
    execute(input: GetCartInput): Promise<Result<Cart>>;
}

@Service()
export class GetCartUseCase implements IGetCartUseCase {
    constructor(
        @Inject('ICartRepository')
        private cartRepository: ICartRepository
    ) { }

    /**
     * Retrieves a user's cart or creates a new one if it doesn't exist
     */
    async execute(input: GetCartInput): Promise<Result<Cart>> {
        let cart = await this.cartRepository.findByUserId(input.userId);

        if (!cart) {
            cart = new Cart(
                uuidv4(),
                input.userId,
                []
            );
            cart = await this.cartRepository.create(cart);
        }

        return ResultHelper.success(cart);
    }
}
