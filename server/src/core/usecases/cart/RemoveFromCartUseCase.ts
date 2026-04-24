import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Cart } from '../../entities/Cart.js';
import { ICartRepository } from '../../repositories/ICartRepository.js';

export interface RemoveFromCartInput {
    userId: string;
    productId: string;
    variantId?: string | undefined;
}

export interface IRemoveFromCartUseCase {
    execute(input: RemoveFromCartInput): Promise<Result<Cart>>;
}

@Service()
export class RemoveFromCartUseCase implements IRemoveFromCartUseCase {
    constructor(
        @Inject('ICartRepository') private cartRepository: ICartRepository
    ) { }

    async execute(input: RemoveFromCartInput): Promise<Result<Cart>> {
        const cart = await this.cartRepository.findByUserId(input.userId);

        if (!cart) {
            return ResultHelper.failure('Cart not found', ErrorCode.NOT_FOUND);
        }

        // Filter out items matching productId AND variantId (if provided)
        cart.items = cart.items.filter(item => {
            const sameProduct = item.productId === input.productId;
            if (input.variantId !== undefined) {
                return !(sameProduct && item.variantId === input.variantId);
            }
            return !sameProduct;
        });

        cart.updatedAt = new Date();

        const updatedCart = await this.cartRepository.update(cart);
        return ResultHelper.success(updatedCart);
    }
}
