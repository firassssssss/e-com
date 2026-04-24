import { Service } from 'typedi';
import { IEventListener, IParallelEventListener } from '../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { ProductAddedToWishlistPayload } from '../../../core/events/ProductAddedToWishlistEvent.js';

/**
 * Listener for PRODUCT_ADDED_TO_WISHLIST events
 * Tracks analytics for popular wishlisted products
 */
@Service()
export class ProductAddedToWishlistListener implements
    IEventListener<ProductAddedToWishlistPayload>,
    IParallelEventListener<ProductAddedToWishlistPayload> {
    readonly parallel = true;

    async handle(event: DomainEvent<ProductAddedToWishlistPayload>): Promise<void> {
        console.log(`[ProductAddedToWishlistListener] Product added to wishlist: ${event.payload.productId} by user ${event.payload.userId}`);

        try {
            // Analytics tracking mockup
            console.log('[ProductAddedToWishlistListener] Analytics tracked');
        } catch (error) {
            console.error(`[ProductAddedToWishlistListener] Analytics tracking failed (non-critical):`, error);
        }
    }
}
