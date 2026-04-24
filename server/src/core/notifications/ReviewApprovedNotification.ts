import { Notification } from './Notification.js';

/**
 * Notification sent to a customer when their product review has been approved and published.
 */
export class ReviewApprovedNotification extends Notification {
    private reviewData: {
        reviewId: string;
        productId: string;
        productName: string;
    };

    /**
     * Creates an instance of ReviewApprovedNotification.
     * @param reviewData - The details of the approved review.
     */
    constructor(reviewData: {
        reviewId: string;
        productId: string;
        productName: string;
    }) {
        super();
        this.reviewData = reviewData;
    }

    via(notifiable: any): string[] {
        return ['database']; // Database only, non-intrusive
    }

    /**
     * Database notification
     */
    toDatabase(notifiable: any): Record<string, any> {
        return {
            title: '✅ Your Review is Live!',
            body: `Your review for ${this.reviewData.productName} has been approved and published`,
            data: {
                type: 'review_approved',
                reviewId: this.reviewData.reviewId,
                productId: this.reviewData.productId,
                actionUrl: `/products/${this.reviewData.productId}`,
            },
        };
    }
}
