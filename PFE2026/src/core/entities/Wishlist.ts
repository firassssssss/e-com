// Note: Wishlist can be a collection of items, or just items with userId. 
// Standard approach: Wishlist entity per user (1-to-1) containing items, or WishlistItem table.
// Given MVP, let's treat it as a collection of productId's for a user.
// But to allow "Shared Wishlists" in future, maybe Wishlist entity is better.
// Schema: Wishlists (id, userId, name, isPublic) -> WishlistItems (wishlistId, productId, addedAt)
// Or simpler: WishlistItems (userId, productId, addedAt). 
// Guide says "Wishlists: Schema, Entity...". Plural implies potentially multiple?
// Let's stick to simple "User has one Wishlist" concept for MVP or "WishlistItem" rows.
// Steps say "Design Wishlist Entity". I'll create `Wishlist` and `WishlistItem`.

export class WishlistItem {
    constructor(
        public readonly id: string,
        public wishlistId: string,
        public productId: string,
        public addedAt: Date = new Date()
    ) { }
}

export class Wishlist {
    constructor(
        public readonly id: string,
        public userId: string,
        public name: string = 'My Wishlist',
        public isPublic: boolean = false,
        public items: WishlistItem[] = [],
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }
}
