import { Service, Inject } from 'typedi';
import { IEventListener, IParallelEventListener, IRetryableEventListener } from '../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { ReviewApprovedPayload } from '../../../core/events/ReviewApprovedEvent.js';
import { NotificationManager } from '../../../core/notifications/NotificationManager.js';
import { ReviewApprovedNotification } from '../../../core/notifications/ReviewApprovedNotification.js';
import { IUserRepository } from '../../../core/repositories/IUserRepository.js';
import { IProductRepository } from '../../../core/repositories/IProductRepository.js';
import { IReviewRepository } from '../../../core/repositories/IReviewRepository.js';

/**
 * Listener for REVIEW_APPROVED events
 * 1. Notifies customer their review is live
 * 2. Updates product average rating
 */
@Service()
export class ReviewApprovedListener implements
    IEventListener<ReviewApprovedPayload>,
    IParallelEventListener<ReviewApprovedPayload>,
    IRetryableEventListener<ReviewApprovedPayload> {
    readonly parallel = true;
    readonly retryable = true;
    readonly maxRetries = 3;

    constructor(
        @Inject('NotificationManager') private readonly notificationManager: NotificationManager,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        @Inject('IProductRepository') private readonly productRepository: IProductRepository,
        @Inject('IReviewRepository') private readonly reviewRepository: IReviewRepository
    ) { }

    async handle(event: DomainEvent<ReviewApprovedPayload>): Promise<void> {
        console.log(`[ReviewApprovedListener] Review approved: ${event.payload.reviewId}`);

        try {
            // 1. Get user and product details
            const [user, product] = await Promise.all([
                this.userRepository.findById(event.payload.userId),
                this.productRepository.findById(event.payload.productId),
            ]);

            if (!user) {
                console.warn(`[ReviewApprovedListener] User not found: ${event.payload.userId}`);
                return;
            }

            if (!product) {
                console.warn(`[ReviewApprovedListener] Product not found: ${event.payload.productId}`);
                return;
            }

            // 2. Send notification to customer
            const notification = new ReviewApprovedNotification({
                reviewId: event.payload.reviewId,
                productId: event.payload.productId,
                productName: product.name,
            });

            await this.notificationManager.send(user, notification);

            // 3. Update product average rating
            await this.reviewRepository.updateProductAverageRating(event.payload.productId);

            console.log(`[ReviewApprovedListener] Successfully processed review approval for ${event.payload.reviewId}`);
        } catch (error) {
            console.error(`[ReviewApprovedListener] Failed to process review approved event:`, error);
            throw error;
        }
    }
}
