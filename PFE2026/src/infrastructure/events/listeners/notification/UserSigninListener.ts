// infrastructure/events/listeners/notification/UserSigninListener.ts
import { Service, Inject } from 'typedi';
import { IEventListener } from '../../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../../core/events/DomainEvent.js';
import { UserSigninPayload } from '../../../../core/events/NotificationEvents.js';
import { NotificationManager } from '../../../../core/notifications/NotificationManager.js';
import { UserSigninNotification } from '../../../../core/notifications/UserSigninNotification.js';
import { IUserRepository } from '../../../../core/repositories/IUserRepository.js';

/**
 * Listener for USER_SIGNIN events.
 * Notifies the user about a new signin to their account.
 * 
 * SEQUENTIAL execution as it involves security-related activity tracking.
 */
@Service()
export class UserSigninListener implements IEventListener<UserSigninPayload> {
    constructor(
        @Inject('NotificationManager') private readonly notificationManager: NotificationManager,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository
    ) { }

    /**
     * Handles the user signin event.
     * @param event - The signin event details.
     */
    async handle(event: DomainEvent<UserSigninPayload>): Promise<void> {
        console.log(`[UserSigninListener] Processing USER_SIGNIN event for user ${event.payload.userId}`);

        try {
            const user = await this.userRepository.findById(event.payload.userId);

            if (!user) {
                console.warn(`[UserSigninListener] User not found: ${event.payload.userId}`);
                return;
            }

            // Create notification
            const notification = new UserSigninNotification({
                userId: user.id,
                username: user.name,
                profilePicUrl: user.image || undefined,
                signinTime: new Date(),
                // ipAddress and deviceInfo could be added to payload if needed
            });

            // Send to user
            await this.notificationManager.send(user, notification);

            console.log(`[UserSigninListener] Successfully sent signin notification to user ${user.id}`);
        } catch (error) {
            console.error(`[UserSigninListener] Failed to process USER_SIGNIN for user ${event.payload.userId}:`, error);
            throw error;
        }
    }
}
