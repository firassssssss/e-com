import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Review } from '../../entities/Review.js';
import { IReviewRepository } from '../../repositories/IReviewRepository.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { IEventEmitter } from '../../services/IEventEmitter.js';
import { ReviewCreatedEvent } from '../../events/ReviewCreatedEvent.js';
import { v4 as uuidv4 } from 'uuid';

export interface AddReviewInput {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
    images?: string[];
    // isVerifiedPurchase logic? Ideally passed from controller after checking orders. For MVP, explicit arg or calculated.
    // For now, let's assume it's calculated in logic if we had OrderRepo access, or passed in. 
    // Let's keep distinct logic: Controller might check orders and pass flag, or UseCase checks orders.
    // To keep UseCase pure, Controller or checking UseCase injects OrderRepo.
    // For MVP, we will default to false unless logic added.
}

export interface IAddReviewUseCase {
    execute(input: AddReviewInput): Promise<Result<Review>>;
}

@Service()
export class AddReviewUseCase implements IAddReviewUseCase {
    constructor(
        @Inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository,
        @Inject('IEventEmitter') private eventEmitter: IEventEmitter
    ) { }

    async execute(input: AddReviewInput): Promise<Result<Review>> {
        const product = await this.productRepository.findById(input.productId);
        if (!product) {
            return ResultHelper.failure('Product not found', ErrorCode.NOT_FOUND);
        }

        if (input.rating < 1 || input.rating > 5) {
            return ResultHelper.failure('Rating must be between 1 and 5', ErrorCode.VALIDATION_ERROR);
        }

        const review = new Review(
            uuidv4(),
            input.userId,
            input.productId,
            input.rating,
            input.comment || null,
            input.images || [],
            false, // isVerifiedPurchase defaults to false for now
            false  // isApproved: Needs moderation
        );

        const created = await this.reviewRepository.create(review);

        // Emit ReviewCreatedEvent for admin moderation notification
        await this.eventEmitter.emit(new ReviewCreatedEvent({
            reviewId: created.id,
            productId: created.productId,
            userId: created.userId,
            rating: created.rating,
            comment: created.comment || undefined,
            isVerifiedPurchase: created.isVerifiedPurchase
        }));

        return ResultHelper.success(created);
    }
}
