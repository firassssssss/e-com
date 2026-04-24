import { Service } from 'typedi';
import { IEventListener, IParallelEventListener } from '../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { AddressCreatedPayload } from '../../../core/events/AddressCreatedEvent.js';

/**
 * Listener for ADDRESS_CREATED events
 * Tracks analytics for shipping patterns
 */
@Service()
export class AddressCreatedListener implements
    IEventListener<AddressCreatedPayload>,
    IParallelEventListener<AddressCreatedPayload> {
    readonly parallel = true;

    async handle(event: DomainEvent<AddressCreatedPayload>): Promise<void> {
        console.log(`[AddressCreatedListener] New address created in ${event.payload.governorate}, ${event.payload.city}`);

        try {
            // Analytics: Track popular delivery zones
            console.log(`[AddressCreatedListener] Tracking delivery zone: ${event.payload.governorate}`);
        } catch (error) {
            console.error(`[AddressCreatedListener] Analytics tracking failed (non-critical):`, error);
        }
    }
}
