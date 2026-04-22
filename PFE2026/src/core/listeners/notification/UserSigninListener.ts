import { Service } from 'typedi';
import { IEventListener } from '../../events/IEventListener.js';
import { DomainEvent } from '../../events/DomainEvent.js';
import { UserSignin } from '../../events/handlers/auth/UserSignin.js';
import { SendNotificationUseCase } from '../../usecases/notification/SendNotificationUseCase.js';
import { UserSigninPayload } from '../../events/NotificationEvents.js';

/**
 * Listener that handles USER_SIGNIN events.
 * Processes user signin logic before notification is sent.
 */
@Service()
export class UserSigninListener implements IEventListener<UserSigninPayload> {
  constructor(
    private readonly userSignin: UserSignin,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async handle(event: DomainEvent<UserSigninPayload>): Promise<void> {
    console.log(`[UserSigninListener] Processing USER_SIGNIN event for user ${event.payload.userId}`);

    try {
      const result = await this.userSignin.execute(event.payload);

      if (!result.success) {
        console.warn('[UserSigninListener] UserSigninUseCase failed:', result.error);
        throw new Error(`UserSigninUseCase failed: ${result.error}`);
      }

      await this.sendNotificationUseCase.execute({
        userId: event.payload.userId,
        body: result.body,
        title: result.title,
        type: 'USER_SIGNIN',
        data: result.data,
      })
      console.log(`[UserSigninListener] Successfully processed USER_SIGNIN for user ${event.payload.userId}`);

    } catch (error) {
      console.error(`[UserSigninListener] Failed to process USER_SIGNIN for user ${event.payload.userId}:`, error);
      throw error;
    }
  }
}
