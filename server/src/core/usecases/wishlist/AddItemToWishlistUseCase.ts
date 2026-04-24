import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { IWishlistRepository } from '../../repositories/IWishlistRepository.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { IGetWishlistUseCase } from './GetWishlistUseCase.js';

export interface IAddItemToWishlistUseCase {
    execute(userId: string, productId: string): Promise<Result<void>>;
}

@Service()
export class AddItemToWishlistUseCase implements IAddItemToWishlistUseCase {
    constructor(
        @Inject('IWishlistRepository') private wishlistRepository: IWishlistRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository,
        @Inject('IGetWishlistUseCase') private getWishlistUseCase: IGetWishlistUseCase
    ) { }

    async execute(userId: string, productId: string): Promise<Result<void>> {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            return ResultHelper.failure('Product not found', ErrorCode.NOT_FOUND);
        }

        const wishlistResult = await this.getWishlistUseCase.execute(userId);
        if (!wishlistResult.success || !wishlistResult.data) {
            return ResultHelper.failure('Could not retrieve wishlist', ErrorCode.INTERNAL_ERROR);
        }

        const wishlistId = wishlistResult.data.id;
        await this.wishlistRepository.addItem(wishlistId, productId);

        return ResultHelper.success(undefined);
    }
}
