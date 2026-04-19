import { Review } from '../../../../core/entities/Review.js';
import { reviews } from '../../../../infrastructure/db/schema/reviews.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbReview = InferSelectModel<typeof reviews>;
type NewDbReview = InferInsertModel<typeof reviews>;

export class ReviewMapper {
    static toDomain(dbReview: DbReview): Review {
        return new Review(
            dbReview.id,
            dbReview.userId,
            dbReview.productId,
            dbReview.rating,
            dbReview.comment,
            dbReview.images || [],
            dbReview.isVerifiedPurchase,
            dbReview.isApproved,
            dbReview.createdAt,
            dbReview.updatedAt
        );
    }

    static toPersistence(review: Review): NewDbReview {
        return {
            id: review.id,
            userId: review.userId,
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            isVerifiedPurchase: review.isVerifiedPurchase,
            isApproved: review.isApproved,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        };
    }
}
