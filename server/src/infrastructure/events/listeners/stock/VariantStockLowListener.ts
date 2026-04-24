// infrastructure/events/listeners/stock/VariantStockLowListener.ts
import { Service, Inject } from 'typedi';
import { IEventListener, IRetryableEventListener } from '../../../../core/events/IEventListener.js';
import { DomainEvent } from '../../../../core/events/DomainEvent.js';
import { VariantStockLowPayload } from '../../../../core/events/VariantStockLowEvent.js';
import { NotificationManager } from '../../../../core/notifications/NotificationManager.js';
import { LowStockAlertNotification } from '../../../../core/notifications/LowStockAlertNotification.js';
import { IUserRepository } from '../../../../core/repositories/IUserRepository.js';

/**
 * Listener for VARIANT_STOCK_LOW events.
 * Sends critical alerts to all admins when variant stock is low.
 * 
 * SEQUENTIAL execution (not parallel) to ensure proper processing.
 * RETRYABLE with 3 attempts for critical notifications.
 */
@Service()
export class VariantStockLowListener implements IEventListener<VariantStockLowPayload>, IRetryableEventListener<VariantStockLowPayload> {
    // IRetryableEventListener properties
    readonly retryable = true;
    readonly maxRetries = 3;

    constructor(
        @Inject('NotificationManager') private readonly notificationManager: NotificationManager,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository
    ) { }

    /**
     * Handles the low stock event.
     * @param event - The stock event details.
     */
    async handle(event: DomainEvent<VariantStockLowPayload>): Promise<void> {
        console.log(`[VariantStockLowListener] Processing stock alert for SKU: ${event.payload.sku}`);

        try {
            // Get all admin users
            const admins = await this.userRepository.findAdmins();

            if (admins.length === 0) {
                console.warn('[VariantStockLowListener] No admin users found to notify');
                return;
            }

            // Create notification
            const notification = new LowStockAlertNotification({
                productName: event.payload.productName,
                variantName: event.payload.variantName,
                sku: event.payload.sku,
                currentStock: event.payload.currentStock,
                threshold: event.payload.threshold,
            });

            // Send to all admins
            for (const admin of admins) {
                await this.notificationManager.send(admin, notification);
            }

            console.log(`[VariantStockLowListener] Successfully notified ${admins.length} admins about low stock: ${event.payload.sku}`);
        } catch (error) {
            console.error(`[VariantStockLowListener] Failed to process low stock alert:`, error);
            throw error; // Rethrow to trigger retry
        }
    }
}
