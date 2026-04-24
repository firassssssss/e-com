import { Service, Inject } from 'typedi';
import { IEventListener } from '../../IEventListener.js';
import { DomainEvent } from '../../DomainEvent.js';
import { OrderPlacedPayload } from '../../OrderPlacedEvent.js';

@Service()
export class OrderConfirmationHandler implements IEventListener<OrderPlacedPayload> {
    eventType = 'ORDER_PLACED';

    constructor(
        @Inject('IEmailService') private readonly emailService: any
    ) {}

    async handle(event: DomainEvent<OrderPlacedPayload>): Promise<void> {
        const { orderId, userId, totalAmount } = event.payload;
        // Logic to send order receipt to the user
        await this.emailService.sendOrderReceipt(userId, orderId, totalAmount);
    }
}
