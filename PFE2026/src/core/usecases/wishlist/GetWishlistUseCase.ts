import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Wishlist } from '../../entities/Wishlist.js';
import { IWishlistRepository } from '../../repositories/IWishlistRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface IGetWishlistUseCase {
    execute(userId: string): Promise<Result<Wishlist>>;
}

@Service()
export class GetWishlistUseCase implements IGetWishlistUseCase {
    constructor(
        @Inject('IWishlistRepository') private wishlistRepository: IWishlistRepository
    ) { }

    async execute(userId: string): Promise<Result<Wishlist>> {
        let wishlist = await this.wishlistRepository.findByUserId(userId);

        if (!wishlist) {
            // Auto-create wishlist if it doesn't exist
            const newWishlist = new Wishlist(
                uuidv4(),
                userId
            );
            wishlist = await this.wishlistRepository.create(newWishlist);
        }

        return ResultHelper.success(wishlist);
    }
}
