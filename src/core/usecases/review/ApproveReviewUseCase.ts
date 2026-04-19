import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { IReviewRepository } from '../../repositories/IReviewRepository.js';
import { IEventEmitter } from '../../services/IEventEmitter.js';
import { ReviewApprovedEvent } from '../../events/ReviewApprovedEvent.js';

export interface ApproveReviewInput {
    reviewId: string;
}

export interface IApproveReviewUseCase {
    execute(input: ApproveReviewInput): Promise<Result<void>>;
}

/**
 * Use case for administrators to approve a product review.
 * Approving a review makes it publicly visible and updates the product's overall rating.
 */
@Service()
export class ApproveReviewUseCase implements IApproveReviewUseCase {
    constructor(
        @Inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @Inject('IEventEmitter') private eventEmitter: IEventEmitter
    ) { }

    /**
     * Executes the review approval logic.
     * @param input - The review ID to approve.
     * @returns A success result or a failure result if the review is not found or already approved.
     */
    async execute(input: ApproveReviewInput): Promise<Result<void>> {
        try {
            const review = await this.reviewRepository.findById(input.reviewId);
            if (!review) {
                return ResultHelper.failure('Review not found', ErrorCode.NOT_FOUND);
            }

            if (review.isApproved) {
                return ResultHelper.failure('Review is already approved', ErrorCode.CONFLICT);
            }

            review.isApproved = true;
            review.updatedAt = new Date();

            await this.reviewRepository.update(review);

            // Emit ReviewApprovedEvent to trigger rating update and customer notification
            await this.eventEmitter.emit(new ReviewApprovedEvent({
                reviewId: review.id,
                productId: review.productId,
                userId: review.userId,
                rating: review.rating
            }));

            console.log(`[ApproveReviewUseCase] Successfully approved review ${review.id}`);
            return ResultHelper.success(undefined);
        } catch (error) {
            console.error('[ApproveReviewUseCase] Error:', error);
            return ResultHelper.failure('Failed to approve review', ErrorCode.INTERNAL_ERROR);
        }
    }
}
