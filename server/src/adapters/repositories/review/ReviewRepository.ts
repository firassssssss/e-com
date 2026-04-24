import { Service } from 'typedi';
import { IReviewRepository } from '../../../core/repositories/IReviewRepository.js';
import { Review } from '../../../core/entities/Review.js';
import { db } from '../../../infrastructure/db/index.js';
import { reviews } from '../../../infrastructure/db/schema/reviews.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import { ReviewMapper } from './mappers/ReviewMapper.js';

@Service()
export class ReviewRepository implements IReviewRepository {
    async findById(id: string): Promise<Review | null> {
        const result = await db.select().from(reviews).where(eq(reviews.id, id));
        return result[0] ? ReviewMapper.toDomain(result[0]) : null;
    }

    async findByProductId(productId: string): Promise<Review[]> {
        const result = await db
            .select()
            .from(reviews)
            .where(eq(reviews.productId, productId))
            .orderBy(desc(reviews.createdAt));
        return result.map(ReviewMapper.toDomain);
    }

    async findByUserId(userId: string): Promise<Review[]> {
        const result = await db
            .select()
            .from(reviews)
            .where(eq(reviews.userId, userId))
            .orderBy(desc(reviews.createdAt));
        return result.map(ReviewMapper.toDomain);
    }

    async create(review: Review): Promise<Review> {
        const dbReview = ReviewMapper.toPersistence(review);
        const result = await db.insert(reviews).values(dbReview).returning();
        return ReviewMapper.toDomain(result[0]);
    }

    async update(review: Review): Promise<Review> {
        const dbReview = ReviewMapper.toPersistence(review);
        const result = await db
            .update(reviews)
            .set(dbReview)
            .where(eq(reviews.id, review.id))
            .returning();
        return ReviewMapper.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await db.delete(reviews).where(eq(reviews.id, id));
    }

    async calculateAverageRating(productId: string): Promise<{ average: number; count: number }> {
        const result = await db
            .select({
                average: sql<number>`avg(${reviews.rating})`,
                count: sql<number>`count(${reviews.id})`
            })
            .from(reviews)
            .where(eq(reviews.productId, productId));

        return {
            average: result[0]?.average ? Number(result[0].average) : 0,
            count: result[0]?.count ? Number(result[0].count) : 0
        };
    }

    async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(reviews)
            .where(
                and(
                    eq(reviews.userId, userId),
                    eq(reviews.productId, productId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    async updateProductAverageRating(productId: string): Promise<void> {
        const stats = await this.calculateAverageRating(productId);

        const { products } = await import('../../../infrastructure/db/schema/products.js');

        await db
            .update(products)
            .set({
                averageRating: stats.average.toFixed(2),
                reviewCount: stats.count,
                updatedAt: new Date()
            })
            .where(eq(products.id, productId));
    }
}
