export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

export class OrderItem {
    constructor(
        public productId: string,
        public productName: string,      // Snapshot
        public quantity: number,
        public priceAtPurchase: number,   // Snapshot
        public variantId?: string
    ) { }
}

export class Order {
    constructor(
        public readonly id: string,
        public userId: string,
        public items: OrderItem[],
        public totalAmount: number,
        public status: OrderStatus,
        public shippingAddress: string,
        public paymentMethod: string,    // 'stripe', 'cash_on_delivery'
        public stripePaymentIntentId?: string,
        public trackingNumber?: string,
        public estimatedDeliveryDate?: Date,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }
}
