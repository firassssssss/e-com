import { UserSigninListener } from './notification/UserSigninListener.js';
import { VariantStockLowListener } from './stock/VariantStockLowListener.js';
import { VariantOutOfStockListener } from './stock/VariantOutOfStockListener.js';
import { ReviewCreatedListener } from './review/ReviewCreatedListener.js';
import { ReviewApprovedListener } from './review/ReviewApprovedListener.js';
import { ProductAddedToWishlistListener } from './wishlist/ProductAddedToWishlistListener.js';
import { AddressCreatedListener } from './address/AddressCreatedListener.js';

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

  // E-commerce events
  'VARIANT_STOCK_LOW': [VariantStockLowListener],
  'VARIANT_OUT_OF_STOCK': [VariantOutOfStockListener],
  'REVIEW_CREATED': [ReviewCreatedListener],
  'REVIEW_APPROVED': [ReviewApprovedListener],
  'PRODUCT_ADDED_TO_WISHLIST': [ProductAddedToWishlistListener],
  'ADDRESS_CREATED': [AddressCreatedListener],
};
