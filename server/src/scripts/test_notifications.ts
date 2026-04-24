import 'reflect-metadata';
import { LowStockAlertNotification } from '../core/notifications/LowStockAlertNotification.js';
import { OutOfStockAlertNotification } from '../core/notifications/OutOfStockAlertNotification.js';
import { ReviewModerationNotification } from '../core/notifications/ReviewModerationNotification.js';
import { ReviewApprovedNotification } from '../core/notifications/ReviewApprovedNotification.js';

process.env.APP_URL = 'http://localhost:3000';

function verifyNotifications() {
    console.log('--- Verifying Notification Payloads ---\n');

    const notifiable = { id: 'user-123', email: 'admin@example.com' };

    // 1. Low Stock Alert
    console.log('1. LowStockAlertNotification:');
    const lowStock = new LowStockAlertNotification({
        productName: 'Facial Cleanser',
        variantName: '500ml',
        sku: 'FC-500',
        currentStock: 5,
        threshold: 10
    });
    console.log('- Channels:', lowStock.via(notifiable));
    console.log('- DB Payload:', JSON.stringify(lowStock.toDatabase(notifiable), null, 2));
    console.log('- Mail Subject:', lowStock.toMail(notifiable).subject);
    console.log('- FCM Title:', lowStock.toFCM(notifiable).title);
    console.log('\n');

    // 2. Out of Stock Alert
    console.log('2. OutOfStockAlertNotification:');
    const outOfStock = new OutOfStockAlertNotification({
        productName: 'Moisturizer',
        variantName: '100ml',
        sku: 'MO-100'
    });
    console.log('- Channels:', outOfStock.via(notifiable));
    console.log('- DB Payload:', JSON.stringify(outOfStock.toDatabase(notifiable), null, 2));
    console.log('- Mail Subject:', outOfStock.toMail(notifiable).subject);
    console.log('- FCM Title:', outOfStock.toFCM(notifiable).title);
    console.log('\n');

    // 3. Review Moderation
    console.log('3. ReviewModerationNotification:');
    const reviewMod = new ReviewModerationNotification({
        reviewId: 'rev-789',
        productId: 'prod-456',
        rating: 5,
        comment: 'Excellent product!',
        isVerifiedPurchase: true
    });
    console.log('- Channels:', reviewMod.via(notifiable));
    console.log('- DB Payload:', JSON.stringify(reviewMod.toDatabase(notifiable), null, 2));
    console.log('- FCM Title:', reviewMod.toFCM(notifiable).title);
    console.log('\n');

    // 4. Review Approved
    console.log('4. ReviewApprovedNotification:');
    const reviewApp = new ReviewApprovedNotification({
        reviewId: 'rev-789',
        productId: 'prod-456',
        productName: 'Facial Cleanser'
    });
    console.log('- Channels:', reviewApp.via(notifiable));
    console.log('- DB Payload:', JSON.stringify(reviewApp.toDatabase(notifiable), null, 2));
    console.log('\n');

    console.log('--- Verification Complete ---');
}

verifyNotifications();
