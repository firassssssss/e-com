import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Review } from '../../entities/Review.js';
import { IReviewRepository } from '../../repositories/IReviewRepository.js';

export interface IListProductReviewsUseCase {
    execute(productId: string): Promise<Result<Review[]>>;
}

@Service()
export class ListProductReviewsUseCase implements IListProductReviewsUseCase {
    constructor(
        @Inject('IReviewRepository') private reviewRepository: IReviewRepository
    ) { }

    async execute(productId: string): Promise<Result<Review[]>> {
        const reviews = await this.reviewRepository.findByProductId(productId);
        return ResultHelper.success(reviews);
    }
}
