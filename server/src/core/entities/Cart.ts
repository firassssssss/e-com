export class CartItem {
    constructor(
        public productId: string,
        public quantity: number,
        public price: number,
        public variantId?: string
    ) { }
}

export class Cart {
    constructor(
        public readonly id: string,
        public userId: string,
        public items: CartItem[],
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }

    getTotalPrice(): number {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getTotalItems(): number {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
}
