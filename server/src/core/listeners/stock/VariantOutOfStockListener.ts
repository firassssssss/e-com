import { Service, Inject } from 'typedi';
import { IEventListener, IRetryableEventListener } from '../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { VariantOutOfStockPayload } from '../../../core/events/VariantOutOfStockEvent.js';
import { NotificationManager } from '../../../core/notifications/NotificationManager.js';
import { OutOfStockAlertNotification } from '../../../core/notifications/OutOfStockAlertNotification.js';
import { IUserRepository } from '../../../core/repositories/IUserRepository.js';

/**
 * Listener for VARIANT_OUT_OF_STOCK events
 * Sends URGENT alerts to all admins when variant is out of stock
 */
@Service()
export class VariantOutOfStockListener implements IEventListener<VariantOutOfStockPayload>, IRetryableEventListener<VariantOutOfStockPayload> {
    readonly retryable = true;
    readonly maxRetries = 3;

    constructor(
        @Inject('NotificationManager') private readonly notificationManager: NotificationManager,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository
    ) { }

    async handle(event: DomainEvent<VariantOutOfStockPayload>): Promise<void> {
        console.log(`[VariantOutOfStockListener] 🚨 CRITICAL: Product variant out of stock: ${event.payload.sku}`);

        try {
            // Get all admin users
            const admins = await this.userRepository.findAdmins();

            if (admins.length === 0) {
                console.error('[VariantOutOfStockListener] 🚨 CRITICAL: No admin users found to notify about stockout!');
                return;
            }

            // Create urgent notification
            const notification = new OutOfStockAlertNotification({
                productName: event.payload.productName,
                variantName: event.payload.variantName,
                sku: event.payload.sku,
            });

            // Send to all admins immediately
            for (const admin of admins) {
                await this.notificationManager.send(admin, notification);
            }

            console.log(`[VariantOutOfStockListener] Successfully sent urgent stockout alerts to ${admins.length} admins`);
        } catch (error) {
            console.error(`[VariantOutOfStockListener] Failed to send stockout alerts:`, error);
            throw error; // Rethrow to trigger retry
        }
    }
}
