// infrastructure/events/listeners/address/AddressCreatedListener.ts
import { Service } from 'typedi';
import { IEventListener, IParallelEventListener } from '../../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../../core/events/DomainEvent.js';
import { AddressCreatedPayload } from '../../../../core/events/AddressCreatedEvent.js';

/**
 * Listener for ADDRESS_CREATED events.
 * Tracks analytics for shipping patterns.
 * 
 * PARALLEL execution.
 * NOT retryable (analytics data, non-critical).
 */
@Service()
export class AddressCreatedListener implements
    IEventListener<AddressCreatedPayload>,
    IParallelEventListener<AddressCreatedPayload> {
    readonly parallel = true;

    /**
     * Handles the address creation event.
     * @param event - The address event details.
     */
    async handle(event: DomainEvent<AddressCreatedPayload>): Promise<void> {
        console.log(`[AddressCreatedListener] New address created in ${event.payload.governorate}, ${event.payload.city}`);

        try {
            // Analytics: Track popular delivery zones
            console.log(`[AddressCreatedListener] Tracking delivery zone: ${event.payload.governorate}`);

            // TODO: Future enhancement - Update shipping zone statistics
            // TODO: Future enhancement - Identify high-demand areas
        } catch (error) {
            console.error(`[AddressCreatedListener] Analytics tracking failed (non-critical):`, error);
        }
    }
}
