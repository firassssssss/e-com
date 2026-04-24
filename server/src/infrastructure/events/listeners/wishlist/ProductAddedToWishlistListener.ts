// infrastructure/events/listeners/wishlist/ProductAddedToWishlistListener.ts
import { Service } from 'typedi';
import { IEventListener, IParallelEventListener } from '../../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../../core/events/DomainEvent.js';
import { ProductAddedToWishlistPayload } from '../../../../core/events/ProductAddedToWishlistEvent.js';

/**
 * Listener for PRODUCT_ADDED_TO_WISHLIST events.
 * Tracks analytics for popular wishlisted products.
 * 
 * PARALLEL execution.
 * NOT retryable (analytics data, non-critical).
 */
@Service()
export class ProductAddedToWishlistListener implements
    IEventListener<ProductAddedToWishlistPayload>,
    IParallelEventListener<ProductAddedToWishlistPayload> {
    readonly parallel = true;

    /**
     * Handles the wishlist addition event.
     * @param event - The wishlist event details.
     */
    async handle(event: DomainEvent<ProductAddedToWishlistPayload>): Promise<void> {
        console.log(`[ProductAddedToWishlistListener] Product added to wishlist: ${event.payload.productId} by user ${event.payload.userId}`);

        try {
            // Analytics tracking (future: send to analytics service)
            console.log('[ProductAddedToWishlistListener] Analytics tracked');

            // TODO: Future enhancement - notify user when price drops
            // TODO: Future enhancement - send personalized recommendations
        } catch (error) {
            // Don't throw - analytics failures shouldn't block other listeners
            console.error(`[ProductAddedToWishlistListener] Analytics tracking failed (non-critical):`, error);
        }
    }
}
