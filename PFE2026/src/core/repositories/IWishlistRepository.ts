import { Wishlist } from '../entities/Wishlist.js';

export interface IWishlistRepository {
    findByUserId(userId: string): Promise<Wishlist | null>;
    create(wishlist: Wishlist): Promise<Wishlist>;
    addItem(wishlistId: string, productId: string): Promise<void>;
    removeItem(wishlistId: string, productId: string): Promise<void>;
    delete(id: string): Promise<void>;

    /**
     * Check if product is already in user's wishlist
     * @param userId - User ID
     * @param productId - Product ID
     * @returns True if item is in wishlist
     */
    isInWishlist(userId: string, productId: string): Promise<boolean>;
}
