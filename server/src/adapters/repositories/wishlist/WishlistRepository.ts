import { Service } from 'typedi';
import { IWishlistRepository } from '../../../core/repositories/IWishlistRepository.js';
import { Wishlist, WishlistItem } from '../../../core/entities/Wishlist.js';
import { db } from '../../../infrastructure/db/index.js';
import { wishlists, wishlistItems } from '../../../infrastructure/db/schema/wishlists.js';
import { eq, and } from 'drizzle-orm';
import { WishlistMapper } from './mappers/WishlistMapper.js';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class WishlistRepository implements IWishlistRepository {
    async findByUserId(userId: string): Promise<Wishlist | null> {
        const result = await db.select().from(wishlists).where(eq(wishlists.userId, userId));
        if (!result[0]) return null;

        const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, result[0].id));
        return WishlistMapper.toDomain(result[0], items);
    }

    async create(wishlist: Wishlist): Promise<Wishlist> {
        const dbWishlist = WishlistMapper.toPersistence(wishlist);
        const result = await db.insert(wishlists).values(dbWishlist).returning();
        // Assuming new wishlist has no items initially, or we handle batch insert of items.
        // Logic below handles items if present.
        if (wishlist.items.length > 0) {
            // Not implemented for current flows, usually add item one by one.
        }
        return WishlistMapper.toDomain(result[0], []);
    }

    async addItem(wishlistId: string, productId: string): Promise<void> {
        // Check if exists first to avoid duplicate? 
        // Or let DB constraint handle it? For simpler error message, check.
        const existing = await db
            .select()
            .from(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.wishlistId, wishlistId),
                    eq(wishlistItems.productId, productId)
                )
            );

        if (existing.length === 0) {
            await db.insert(wishlistItems).values({
                id: uuidv4(),
                wishlistId: wishlistId,
                productId: productId,
                addedAt: new Date()
            });
        }
    }

    async removeItem(wishlistId: string, productId: string): Promise<void> {
        await db
            .delete(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.wishlistId, wishlistId),
                    eq(wishlistItems.productId, productId)
                )
            );
    }

    async delete(id: string): Promise<void> {
        await db.delete(wishlists).where(eq(wishlists.id, id));
    }

    async isInWishlist(userId: string, productId: string): Promise<boolean> {
        const wishlist = await db
            .select()
            .from(wishlists)
            .where(eq(wishlists.userId, userId))
            .limit(1);

        if (wishlist.length === 0) return false;

        const result = await db
            .select()
            .from(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.wishlistId, wishlist[0].id),
                    eq(wishlistItems.productId, productId)
                )
            )
            .limit(1);

        return result.length > 0;
    }
}
