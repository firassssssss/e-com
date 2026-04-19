import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { IReviewRepository } from '../../repositories/IReviewRepository.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';

export interface IDeleteReviewUseCase {
    execute(id: string, userId: string, isAdmin: boolean): Promise<Result<void>>;
}

@Service()
export class DeleteReviewUseCase implements IDeleteReviewUseCase {
    constructor(
        @Inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository
    ) { }

    async execute(id: string, userId: string, isAdmin: boolean): Promise<Result<void>> {
        const review = await this.reviewRepository.findById(id);
        if (!review) {
            return ResultHelper.failure('Review not found', ErrorCode.NOT_FOUND);
        }

        // Only owner or admin can delete
        if (review.userId !== userId && !isAdmin) {
            return ResultHelper.failure('Unauthorized', ErrorCode.FORBIDDEN);
        }

        await this.reviewRepository.delete(id);

        // Recalculate product stats
        const stats = await this.reviewRepository.calculateAverageRating(review.productId);
        const product = await this.productRepository.findById(review.productId);
        if (product) {
            product.averageRating = stats.average;
            product.reviewCount = stats.count;
            await this.productRepository.update(product);
        }

        return ResultHelper.success(undefined);
    }
}
