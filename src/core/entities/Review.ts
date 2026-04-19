export class Review {
    constructor(
        public readonly id: string,
        public userId: string,
        public productId: string,
        public rating: number, // 1-5
        public comment: string | null,
        public images: string[] = [],
        public isVerifiedPurchase: boolean = false,
        public isApproved: boolean = true, // Auto-approve for now, or false if moderation needed
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }
}
