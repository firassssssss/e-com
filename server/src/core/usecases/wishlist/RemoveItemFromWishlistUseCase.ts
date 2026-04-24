import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { IWishlistRepository } from '../../repositories/IWishlistRepository.js';
import { IGetWishlistUseCase } from './GetWishlistUseCase.js';

export interface IRemoveItemFromWishlistUseCase {
    execute(userId: string, productId: string): Promise<Result<void>>;
}

@Service()
export class RemoveItemFromWishlistUseCase implements IRemoveItemFromWishlistUseCase {
    constructor(
        @Inject('IWishlistRepository') private wishlistRepository: IWishlistRepository,
        @Inject('IGetWishlistUseCase') private getWishlistUseCase: IGetWishlistUseCase
    ) { }

    async execute(userId: string, productId: string): Promise<Result<void>> {
        const wishlistResult = await this.getWishlistUseCase.execute(userId);
        if (!wishlistResult.success || !wishlistResult.data) {
            // If wishlist doesn't exist, technically item is not in it, so success?
            // Or error? Let's say logic error if we try to remove from non-existent list.
            // But GetWishlist auto-creates... so it should exist.
            return ResultHelper.failure('Could not retrieve wishlist', ErrorCode.INTERNAL_ERROR);
        }

        await this.wishlistRepository.removeItem(wishlistResult.data.id, productId);
        return ResultHelper.success(undefined);
    }
}
