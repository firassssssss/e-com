export class OrderStatusHistory {
    constructor(
        public readonly id: string,
        public orderId: string,
        public fromStatus: string | null,
        public toStatus: string,
        public comment: string | null,
        public changedBy: string | null,
        public trackingNumber: string | null,
        public estimatedDeliveryDate: Date | null,
        public createdAt: Date = new Date()
    ) { }
}
