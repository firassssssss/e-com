import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface ReviewCreatedPayload {
    reviewId: string;
    productId: string;
    userId: string;
    rating: number;
    comment?: string;
    isVerifiedPurchase: boolean;
}

export class ReviewCreatedEvent extends BaseDomainEvent<ReviewCreatedPayload> {
    constructor(payload: ReviewCreatedPayload) {
        super('REVIEW_CREATED', payload);
    }
}
