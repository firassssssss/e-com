import { Review } from '../entities/Review.js';

export interface IReviewRepository {
    findById(id: string): Promise<Review | null>;
    findByProductId(productId: string): Promise<Review[]>;
    findByUserId(userId: string): Promise<Review[]>;
    create(review: Review): Promise<Review>;
    update(review: Review): Promise<Review>; // For moderation or editing
    delete(id: string): Promise<void>;
    calculateAverageRating(productId: string): Promise<{ average: number; count: number }>;

    /**
     * Check if user has already reviewed a product
     * @param userId - User ID
     * @param productId - Product ID
     * @returns True if user has reviewed this product
     */
    hasUserReviewedProduct(userId: string, productId: string): Promise<boolean>;

    /**
     * Recalculate and update product's average rating
     * @param productId - Product ID
     */
    updateProductAverageRating(productId: string): Promise<void>;
}
