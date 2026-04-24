import { Service, Inject } from 'typedi';
import { IEventListener } from '../../IEventListener.js';
import { DomainEvent } from '../../DomainEvent.js';
import { ProductAddedToWishlistEvent } from '../../ProductAddedToWishlistEvent.js';

type WishlistPayload = ProductAddedToWishlistEvent['payload'];

@Service()
export class WishlistAnalyticsHandler implements IEventListener<WishlistPayload> {
    eventType = 'PRODUCT_ADDED_TO_WISHLIST';

    constructor(
        @Inject('IAnalyticsRepository') private readonly analyticsRepo: any
    ) {}

    async handle(event: DomainEvent<WishlistPayload>): Promise<void> {
        // Log that a product is popular to improve AI recommendations later
        await this.analyticsRepo.trackWishlist(event.payload.productId);
    }
}
