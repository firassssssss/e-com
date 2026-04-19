import { Service, Inject } from 'typedi';
import { IEventListener } from '../../IEventListener.js';
import { UserRegisteredEvent, UserRegisteredPayload } from '../../UserRegisteredEvent.js';
import { DomainEvent } from '../../DomainEvent.js'; // Import the interface!

@Service()
export class SendWelcomeEmailHandler implements IEventListener<UserRegisteredPayload> {
    eventType = 'USER_REGISTERED';

    constructor(
        @Inject('IEmailService') private readonly emailService: any
    ) {}

    // CHANGE THIS LINE: Use the Payload type in the generic, 
    // and use DomainEvent in the parameter
    async handle(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
        const { email, name } = event.payload;
        await this.emailService.sendWelcome(email, name);
    }
}
