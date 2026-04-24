// infrastructure/events/index.ts
import { UserSigninListener } from './listeners/notification/UserSigninListener.js';
import { VariantStockLowListener } from './listeners/stock/VariantStockLowListener.js';
import { VariantOutOfStockListener } from './listeners/stock/VariantOutOfStockListener.js';
import { ReviewCreatedListener } from './listeners/review/ReviewCreatedListener.js';
import { ReviewApprovedListener } from './listeners/review/ReviewApprovedListener.js';
import { ProductAddedToWishlistListener } from './listeners/wishlist/ProductAddedToWishlistListener.js';
import { AddressCreatedListener } from './listeners/address/AddressCreatedListener.js';

/**
 * Type for listener constructor functions that can be instantiated by TypeDI
 */
export type ListenerConstructor = new (...args: any[]) => any;

/**
 * Event listener registration map.
 * Maps event types to their corresponding listener class constructors.
 * These constructors will be used to dynamically instantiate listeners via TypeDI.
 */
export const EVENT_LISTENER_MAP: Record<string, ListenerConstructor[]> = {
    // Auth events
    'USER_SIGNIN': [UserSigninListener],

    // 🔴 CRITICAL - Stock alerts (Sequential, Retryable)
    'VARIANT_STOCK_LOW': [VariantStockLowListener],
    'VARIANT_OUT_OF_STOCK': [VariantOutOfStockListener],

    // 🟡 HIGH - Review events (Parallel, Retryable)
    'REVIEW_CREATED': [ReviewCreatedListener],
    'REVIEW_APPROVED': [ReviewApprovedListener],

    // 🟢 LOW - Analytics events (Parallel, Non-retryable)
    'PRODUCT_ADDED_TO_WISHLIST': [ProductAddedToWishlistListener],
    'ADDRESS_CREATED': [AddressCreatedListener],
};
