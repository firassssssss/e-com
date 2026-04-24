// infrastructure/events/listeners/review/ReviewCreatedListener.ts
import { Service, Inject } from 'typedi';
import { IEventListener, IParallelEventListener, IRetryableEventListener } from '../../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../../core/events/DomainEvent.js';
import { ReviewCreatedPayload } from '../../../../core/events/ReviewCreatedEvent.js';
import { NotificationManager } from '../../../../core/notifications/NotificationManager.js';
import { ReviewModerationNotification } from '../../../../core/notifications/ReviewModerationNotification.js';
import { IUserRepository } from '../../../../core/repositories/IUserRepository.js';

/**
 * Listener for REVIEW_CREATED events.
 * Notifies admins about new reviews needing moderation.
 * 
 * PARALLEL execution (can run alongside other listeners).
 * RETRYABLE with 3 attempts.
 */
@Service()
export class ReviewCreatedListener implements
    IEventListener<ReviewCreatedPayload>,
    IParallelEventListener<ReviewCreatedPayload>,
    IRetryableEventListener<ReviewCreatedPayload> {
    readonly parallel = true;
    readonly retryable = true;
    readonly maxRetries = 3;

    constructor(
        @Inject('NotificationManager') private readonly notificationManager: NotificationManager,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository
    ) { }

    /**
     * Handles the review creation event.
     * @param event - The review event details.
     */
    async handle(event: DomainEvent<ReviewCreatedPayload>): Promise<void> {
        console.log(`[ReviewCreatedListener] New review created: ${event.payload.reviewId}, rating: ${event.payload.rating}`);

        try {
            // Get all admins for moderation
            const admins = await this.userRepository.findAdmins();

            if (admins.length === 0) {
                console.warn('[ReviewCreatedListener] No admin users found for review moderation');
                return;
            }

            // Create notification
            const notification = new ReviewModerationNotification({
                reviewId: event.payload.reviewId,
                productId: event.payload.productId,
                rating: event.payload.rating,
                comment: event.payload.comment,
                isVerifiedPurchase: event.payload.isVerifiedPurchase,
            });

            // Send to all admins
            for (const admin of admins) {
                await this.notificationManager.send(admin, notification);
            }

            console.log(`[ReviewCreatedListener] Successfully notified ${admins.length} admins about new review`);
        } catch (error) {
            console.error(`[ReviewCreatedListener] Failed to process review created event:`, error);
            throw error;
        }
    }
}
