import { Service, Inject, Container } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Cart, CartItem } from '../../entities/Cart.js';
import { ICartRepository } from '../../repositories/ICartRepository.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { IProductVariantRepository } from '../../repositories/IProductVariantRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface AddToCartInput {
    userId: string;
    productId: string;
    quantity: number;
    variantId?: string;
}

export interface IAddToCartUseCase {
    execute(input: AddToCartInput): Promise<Result<Cart>>;
}

@Service()
export class AddToCartUseCase implements IAddToCartUseCase {
    private variantRepository: IProductVariantRepository;

    constructor(
        @Inject('ICartRepository') private cartRepository: ICartRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository,
    ) {
        // Manually resolve variant repository as fallback
        this.variantRepository = Container.get<IProductVariantRepository>('IProductVariantRepository');
    }

    async execute(input: AddToCartInput): Promise<Result<Cart>> {
        // 1. Validate product exists
        const product = await this.productRepository.findById(input.productId);
        if (!product) {
            return ResultHelper.failure('Product not found', ErrorCode.NOT_FOUND);
        }

        if (!product.isActive) {
            return ResultHelper.failure('Product is not active', ErrorCode.VALIDATION_ERROR);
        }

        // 2. Determine price and stock (handle variant if provided)
        let itemPrice = Number(product.price);
        if (input.variantId) {
            const variant = await this.variantRepository.findById(input.variantId);
            if (!variant) {
                return ResultHelper.failure('Variant not found', ErrorCode.NOT_FOUND);
            }
            if (variant.productId !== input.productId) {
                return ResultHelper.failure('Variant does not belong to product', ErrorCode.VALIDATION_ERROR);
            }
            if (!variant.isActive) {
                return ResultHelper.failure('Variant is not active', ErrorCode.VALIDATION_ERROR);
            }
            if (variant.stock < input.quantity) {
                return ResultHelper.failure('Insufficient stock for variant', ErrorCode.VALIDATION_ERROR);
            }
            itemPrice = Number(variant.price);
        } else {
            // No variant: check product stock if tracked
            if (product.stock !== null && product.stock < input.quantity) {
                return ResultHelper.failure('Insufficient stock', ErrorCode.VALIDATION_ERROR);
            }
        }

        // 3. Get or create cart
        let cart = await this.cartRepository.findByUserId(input.userId);
        if (!cart) {
            cart = new Cart(uuidv4(), input.userId, []);
            cart = await this.cartRepository.create(cart);
        }

        // 4. Add or update item
        const items = [...cart.items];
        const existingItemIndex = items.findIndex(
            item => item.productId === input.productId && item.variantId === input.variantId
        );

        if (existingItemIndex > -1) {
            items[existingItemIndex].quantity += input.quantity;
            items[existingItemIndex].price = itemPrice;
        } else {
            items.push(new CartItem(input.productId, input.quantity, itemPrice, input.variantId));
        }

        cart.items = items;
        cart.updatedAt = new Date();

        // 5. Save and return
        const updatedCart = await this.cartRepository.update(cart);
        return ResultHelper.success(updatedCart);
    }
}
