import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface ReviewApprovedPayload {
    reviewId: string;
    productId: string;
    userId: string;
    rating: number;
}

export class ReviewApprovedEvent extends BaseDomainEvent<ReviewApprovedPayload> {
    constructor(payload: ReviewApprovedPayload) {
        super('REVIEW_APPROVED', payload);
    }
}
