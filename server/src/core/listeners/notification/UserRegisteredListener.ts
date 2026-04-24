import { Service, Inject } from 'typedi';
import { IEventListener } from '../../events/IEventListener.js';
import { DomainEvent } from '../../events/DomainEvent.js';
import { UserRegisteredPayload } from '../../events/UserRegisteredEvent.js';
import { SendWelcomeEmailHandler } from '../../events/handlers/auth/SendWelcomeEmailHandler.js';

@Service()
export class UserRegisteredListener implements IEventListener<UserRegisteredPayload> {
    readonly eventType = 'USER_REGISTERED';

    constructor(
        @Inject() private readonly welcomeHandler: SendWelcomeEmailHandler
    ) {}

    async handle(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
        await this.welcomeHandler.handle(event);
    }
}
