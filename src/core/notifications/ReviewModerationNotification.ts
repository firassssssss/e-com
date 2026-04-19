import { Notification } from './Notification.js';

/**
 * Notification sent to administrators when a new review is submitted and requires moderation.
 */
export class ReviewModerationNotification extends Notification {
    private reviewData: {
        reviewId: string;
        productId: string;
        rating: number;
        comment?: string;
        isVerifiedPurchase: boolean;
    };

    /**
     * Creates an instance of ReviewModerationNotification.
     * @param reviewData - The details of the review submitted.
     */
    constructor(reviewData: {
        reviewId: string;
        productId: string;
        rating: number;
        comment?: string;
        isVerifiedPurchase: boolean;
    }) {
        super();
        this.reviewData = reviewData;
    }

    via(notifiable: any): string[] {
        return ['fcm', 'database']; // FCM for immediate alert, DB for history
    }

    /**
     * Database notification
     */
    toDatabase(notifiable: any): Record<string, any> {
        const stars = '⭐'.repeat(this.reviewData.rating);
        return {
            title: 'New Review to Moderate',
            body: `${stars} review submitted${this.reviewData.isVerifiedPurchase ? ' (Verified Purchase)' : ''}`,
            data: {
                type: 'review_moderation',
                reviewId: this.reviewData.reviewId,
                productId: this.reviewData.productId,
                rating: this.reviewData.rating,
                isVerifiedPurchase: this.reviewData.isVerifiedPurchase,
                actionUrl: `/admin/reviews/${this.reviewData.reviewId}`,
            },
        };
    }

    /**
     * FCM push notification
     */
    toFCM(notifiable: any): { title: string; body: string; data?: Record<string, any> } {
        const stars = '⭐'.repeat(this.reviewData.rating);
        return {
            title: 'New Review to Moderate',
            body: `${stars}${this.reviewData.isVerifiedPurchase ? ' ✓ Verified' : ''}`,
            data: {
                type: 'review_moderation',
                reviewId: this.reviewData.reviewId,
                actionUrl: `/admin/reviews/${this.reviewData.reviewId}`,
            },
        };
    }
}
