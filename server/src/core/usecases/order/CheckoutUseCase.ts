import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Order, OrderItem, OrderStatus } from '../../entities/Order.js';
import { ICartRepository } from '../../repositories/ICartRepository.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { IOrderRepository } from '../../repositories/IOrderRepository.js';
import { IProductVariantRepository } from '../../repositories/IProductVariantRepository.js';
import { ITransactionManager } from '../../repositories/ITransactionManager.js';
import { IPaymentService } from '../../services/IPaymentService.js';
import { IEventEmitter } from '../../services/IEventEmitter.js';
import { orderPlaced } from '../../events/NotificationEvents.js';
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutInput {
    userId: string;
    shippingAddress: string;
    paymentMethod: string;
    currency?: string;
}

export interface ICheckoutUseCase {
    execute(input: CheckoutInput): Promise<Result<Order>>;
}

@Service()
export class CheckoutUseCase implements ICheckoutUseCase {
    constructor(
        @Inject('ICartRepository') private cartRepo: ICartRepository,
        @Inject('IProductRepository') private productRepo: IProductRepository,
        @Inject('IOrderRepository') private orderRepo: IOrderRepository,
        @Inject('IProductVariantRepository') private variantRepo: IProductVariantRepository,
        @Inject('IPaymentService') private paymentService: IPaymentService,
        @Inject('IEventEmitter') private eventEmitter: IEventEmitter,
        @Inject('ITransactionManager') private transactionManager: ITransactionManager
    ) { }

    async execute(input: CheckoutInput): Promise<Result<Order>> {
        try {
            console.log(`[CheckoutUseCase] Starting checkout for user: ${input.userId}`);

            // 1. Validate cart exists
            const cart = await this.cartRepo.findByUserId(input.userId);
            if (!cart || cart.items.length === 0) {
                return ResultHelper.failure('Cart is empty', ErrorCode.VALIDATION_ERROR);
            }

            // 2. Validate stock availability AND create OrderItems snapshot
            const orderItems: OrderItem[] = [];

            // 3. Wrap the critical section in a transaction
            const order = await this.transactionManager.execute(async () => {
                for (const item of cart.items) {
                    const product = await this.productRepo.findById(item.productId);

                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }

                    if (!product.isActive) {
                        throw new Error(`Product ${product.name} is not active`);
                    }

                    if (product.price === null) {
                        throw new Error(`Product ${product.name} has no price defined`);
                    }

                    if (product.stock === null && !product.hasVariants) {
                        throw new Error(`Product ${product.name} stock is not tracked directly`);
                    }

                    // Handling variants if applicable
                    if (product.hasVariants && item.variantId) {
                        const variant = await this.variantRepo.findById(item.variantId);
                        if (!variant) {
                            throw new Error(`Variant ${item.variantId} not found`);
                        }
                        if (variant.stock < item.quantity) {
                            throw new Error(`Insufficient stock for ${product.name} (${variant.name})`);
                        }
                        // Reduce variant stock
                        variant.stock -= item.quantity;
                        await this.variantRepo.update(variant);
                    } else if (product.stock !== null) {
                        if (product.stock < item.quantity) {
                            throw new Error(`Insufficient stock for ${product.name}`);
                        }
                        // Reduce product stock
                        product.stock -= item.quantity;
                        await this.productRepo.update(product);
                    }

                    orderItems.push(new OrderItem(
                        product.id,
                        product.name,
                        item.quantity,
                        Number(product.price),
                        item.variantId
                    ));
                }

                // Recalculate total based on current prices
                const totalAmount = orderItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

                // Create order object (pending)
                const order = new Order(
                    uuidv4(),
                    input.userId,
                    orderItems,
                    totalAmount,
                    OrderStatus.PENDING,
                    input.shippingAddress,
                    input.paymentMethod
                );

                // 4. Process payment (if not cash-on-delivery)
                if (input.paymentMethod === 'stripe') {
                    // Note: In a real scenario, we might create a PaymentIntent first, 
                    // then confirm it after the transaction succeeds. 
                    // But for this walkthrough, we follow the prompt's multi-step logic inside transaction.
                    const chargeResult = await this.paymentService.createCharge({
                        amount: order.totalAmount,
                        currency: input.currency || 'TND',
                        orderId: order.id,
                        userId: input.userId
                    });

                    if (!chargeResult.success) {
                        throw new Error('Payment failed: ' + chargeResult.error);
                    }

                    order.stripePaymentIntentId = chargeResult.data.paymentIntentId;
                }

                // 5. Update order status -> CONFIRMED
                order.status = OrderStatus.CONFIRMED;

                // 6. Save order
                await this.orderRepo.create(order);

                // 7. Clear cart
                await this.cartRepo.clearCart(input.userId);

                return order;
            });

            // 8. Emit event (outside transaction is fine for side effects)
            await this.eventEmitter.emit(orderPlaced({
                orderId: order.id,
                userId: input.userId
            }));

            console.log(`[CheckoutUseCase] Checkout completed successfully. Order: ${order.id}`);
            return ResultHelper.success(order);

        } catch (error: any) {
            console.error('[CheckoutUseCase] Checkout failed:', error);

            // Map common errors to appropriate Result failures
            if (error.message.includes('Insufficient stock')) {
                return ResultHelper.failure(error.message, ErrorCode.VALIDATION_ERROR);
            }
            if (error.message.includes('not found')) {
                return ResultHelper.failure(error.message, ErrorCode.NOT_FOUND);
            }
            if (error.message.includes('Payment failed')) {
                return ResultHelper.failure(error.message, ErrorCode.EXTERNAL_SERVICE_ERROR);
            }

            return ResultHelper.failure(
                error.message || 'An unexpected error occurred during checkout',
                ErrorCode.INTERNAL_ERROR
            );
        }
    }
}
