import { Service, Inject } from 'typedi';
import { IEventListener } from '../../IEventListener.js';
import { DomainEvent } from '../../DomainEvent.js';
// Using the payload type from your event file
import { VariantStockLowPayload } from '../../VariantStockLowEvent.js';

@Service()
export class StockWarningHandler implements IEventListener<VariantStockLowPayload> {
    eventType = 'VARIANT_STOCK_LOW';

    constructor(
        @Inject('INotificationService') private readonly notificationService: any
    ) {}

    async handle(event: DomainEvent<VariantStockLowPayload>): Promise<void> {
        // Send a notification to the Tunisian Admin Dashboard
        await this.notificationService.sendStockAlert(
            event.payload.variantId, 
            event.payload.currentStock
        );
    }
}
