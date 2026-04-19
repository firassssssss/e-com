import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface ProductAddedToWishlistPayload {
    wishlistId: string;
    userId: string;
    productId: string;
    variantId?: string;
}

export class ProductAddedToWishlistEvent extends BaseDomainEvent<ProductAddedToWishlistPayload> {
    constructor(payload: ProductAddedToWishlistPayload) {
        super('PRODUCT_ADDED_TO_WISHLIST', payload);
    }
}
