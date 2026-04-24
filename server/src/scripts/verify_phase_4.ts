import 'reflect-metadata';
import { Container } from 'typedi';
import { EventRegistry } from '../infrastructure/events/EventRegistry.js';
import { createEvent, DomainEvent } from '../core/events/DomainEvent.js';
import { VariantStockLowPayload } from '../core/events/VariantStockLowEvent.js';
import { IUserRepository } from '../core/repositories/IUserRepository.js';

// Manual Mocks
const mockUserRepo = {
    findAdmins: async () => [{ id: 'admin-1', name: 'Admin', email: 'admin@test.com' }],
    findById: async (id: string) => ({ id, name: 'Test User', email: 'user@test.com' })
};

const mockNotificationManager = {
    send: async (notifiable: any, notification: any) => {
        console.log(`[Mock] Sending ${notification.constructor.name} to ${notifiable.name}`);
    }
};

const mockProductRepo = {
    findById: async (id: string) => ({ id, name: 'Test Product' })
};

const mockReviewRepo = {
    updateProductAverageRating: async (id: string) => {
        console.log(`[Mock] Updating rating for ${id}`);
    }
};

// Register Mocks
Container.set('IUserRepository', mockUserRepo);
Container.set('NotificationManager', mockNotificationManager);
Container.set('IProductRepository', mockProductRepo);
Container.set('IReviewRepository', mockReviewRepo);

async function verifyPhase4() {
    console.log('--- Verifying Phase 4: Event Listeners ---\n');

    const registry = Container.get(EventRegistry);
    registry.initialize();

    const eventTypes = registry.getEventTypes();
    console.log('- Registered Event Types:', eventTypes);

    // 1. Test Stock Alert Listener
    console.log('\n1. Testing VariantStockLowListener:');
    const stockEvent = createEvent<VariantStockLowPayload>('VARIANT_STOCK_LOW', {
        variantId: 'var-123',
        productId: 'prod-123',
        productName: 'Cleanser',
        variantName: 'Small',
        sku: 'CL-SM',
        currentStock: 2,
        threshold: 5
    });

    const listeners = registry.getListenersString('VARIANT_STOCK_LOW');
    for (const listener of listeners) {
        await listener.handle(stockEvent);
    }

    // 2. Test Review Approved Listener
    console.log('\n2. Testing ReviewApprovedListener:');
    const reviewEvent = createEvent('REVIEW_APPROVED', {
        reviewId: 'rev-123',
        productId: 'prod-456',
        userId: 'user-789',
        rating: 5
    });

    const reviewListeners = registry.getListenersString('REVIEW_APPROVED');
    for (const listener of reviewListeners) {
        await listener.handle(reviewEvent);
    }

    console.log('\n--- Verification Complete ---');
}

verifyPhase4().catch(console.error);
