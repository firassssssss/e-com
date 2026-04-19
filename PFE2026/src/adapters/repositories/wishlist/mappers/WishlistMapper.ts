import { Wishlist, WishlistItem } from '../../../../core/entities/Wishlist.js';
import { wishlists, wishlistItems } from '../../../../infrastructure/db/schema/wishlists.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbWishlist = InferSelectModel<typeof wishlists>;
type NewDbWishlist = InferInsertModel<typeof wishlists>;
type DbWishlistItem = InferSelectModel<typeof wishlistItems>;
type NewDbWishlistItem = InferInsertModel<typeof wishlistItems>;

export class WishlistMapper {
    static toDomain(dbWishlist: DbWishlist, dbItems: DbWishlistItem[] = []): Wishlist {
        const items = dbItems.map(item => new WishlistItem(item.id, item.wishlistId, item.productId, item.addedAt));
        return new Wishlist(
            dbWishlist.id,
            dbWishlist.userId,
            dbWishlist.name,
            dbWishlist.isPublic,
            items,
            dbWishlist.createdAt,
            dbWishlist.updatedAt
        );
    }

    static toPersistence(wishlist: Wishlist): NewDbWishlist {
        return {
            id: wishlist.id,
            userId: wishlist.userId,
            name: wishlist.name,
            isPublic: wishlist.isPublic,
            createdAt: wishlist.createdAt,
            updatedAt: wishlist.updatedAt,
        };
    }
}
