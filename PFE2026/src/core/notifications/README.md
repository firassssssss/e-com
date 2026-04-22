# Laravel-Style Notification System for TypeScript

This document explains the new Laravel-inspired notification system that has been implemented to complement the existing event-driven architecture.

## Overview

The notification system provides a clean, Laravel-style API for sending notifications through multiple channels (Email, Database, FCM). It maintains compatibility with the existing event-driven system while offering a more intuitive and explicit notification API.

## Architecture

### Core Components

```
src/core/notifications/
├── Notification.ts              # Base notification class
├── NotificationChannel.ts       # Channel interface and types
├── NotificationManager.ts       # Main notification dispatcher
├── NotificationFactory.ts       # Factory for convenient API usage
├── channels/
│   ├── EmailChannel.ts          # Email notification channel
│   ├── DatabaseChannel.ts       # Database notification channel
│   └── FCMChannel.ts            # Firebase Cloud Messaging channel
├── UserSigninNotification.ts    # Example notification implementation
└── examples/
    └── IntegrationExample.ts    # Usage examples and integration demos
```

## Key Features

### ✅ Laravel-Style API
```typescript
// Create notification instance
const notification = new UserSigninNotification({
  userId: user.id,
  username: user.username,
  ipAddress: '192.168.1.100',
  deviceInfo: 'Chrome on Windows'
});

// Send through specified channels
await notificationFactory.notify(user, notification);
```

### ✅ Multi-Channel Support
- **Email**: HTML/text emails with templates and attachments
- **Database**: Store notifications in database (enhances existing system)
- **FCM**: Firebase push notifications for mobile/web
- **Extensible**: Easy to add SMS, Slack, webhook channels

### ✅ Channel Configuration Per Notification
Each notification class determines which channels to use via the `via()` method:

```typescript
class OrderCompletedNotification extends Notification {
  via(notifiable: any): string[] {
    // Send to database always
    const channels = ['database'];
    
    // Add email for important orders
    if (this.order.amount > 1000) {
      channels.push('email');
    }
    
    // Add FCM for mobile users
    if (notifiable.hasMobileApp) {
      channels.push('fcm');
    }
    
    return channels;
  }
}
```

### ✅ Localization Support
Notifications automatically adapt to user's language preference:

```typescript
toMail(notifiable: any): Record<string, any> {
  const userLanguage = notifiable.language || 'en';
  // Content automatically localized
  return {
    subject: 'New Order Completed',
    html: this.generateEmailHTML(),
    // ... other email properties
  };
}
```

### ✅ Event System Integration
Seamlessly integrates with existing event-driven architecture:

```typescript
// Events automatically trigger notifications
const event = createEvent('USER_SIGNIN', { userId: '123' });
const notification = notificationFactory.createNotificationFromEvent('USER_SIGNIN', event.payload);
await notificationManager.send(user, notification);
```

## Usage Examples

### 1. Direct Notification Sending
```typescript
import { NotificationFactory } from '@core/notifications/NotificationFactory';

class UserService {
  constructor(private notificationFactory: NotificationFactory) {}
  
  async signinUser(user: User, signinData: SigninData): Promise<void> {
    // Your business logic...
    
    // Send notification
    const notification = new UserSigninNotification({
      userId: user.id,
      username: user.username,
      ipAddress: signinData.ipAddress,
      deviceInfo: signinData.deviceInfo,
    });
    
    await this.notificationFactory.notify(user, notification);
  }
}
```

### 2. Event-Driven Integration
```typescript
import { UserSigninListener } from '@core/listeners/notification/UserSigninListener';
import { NotificationManager } from '@core/notifications/NotificationManager';

export class EnhancedUserSigninListener implements IEventListener<UserSigninPayload> {
  constructor(
    private readonly userSignin: UserSignin,
    private readonly notificationManager: NotificationManager
  ) {}
  
  async handle(event: DomainEvent<UserSigninPayload>): Promise<void> {
    // Existing business logic
    const result = await this.userSignin.execute(event.payload);
    
    // Enhanced: Send Laravel-style notification
    const notification = new UserSigninNotification({
      userId: event.payload.userId,
      username: result.data.sender.username,
      ipAddress: event.payload.ipAddress,
      deviceInfo: event.payload.deviceInfo,
    });
    
    await this.notificationManager.send(user, notification);
  }
}
```

### 3. Multi-Channel Notification
```typescript
class SecurityAlertNotification extends Notification {
  via(notifiable: any): string[] {
    return ['database', 'email', 'fcm']; // All channels
  }
  
  toDatabase(notifiable: any): Record<string, any> {
    return {
      title: 'Security Alert',
      body: 'Unusual login activity detected',
      data: { alertType: 'security', severity: 'high' }
    };
  }
  
  toMail(notifiable: any): Record<string, any> {
    return {
      subject: '🚨 Security Alert: Unusual Login Activity',
      html: this.generateSecurityAlertEmail(),
      data: { alertType: 'security', actionUrl: '/security/activity' }
    };
  }
  
  toFCM(notifiable: any): { title: string; body: string; data?: Record<string, any> } {
    return {
      title: 'Security Alert',
      body: 'Unusual login detected',
      data: { alertType: 'security', actionUrl: '/security/activity' }
    };
  }
}
```

### 4. Batch Notifications
```typescript
// Send the same notification to multiple users
const users = await userRepository.findOnlineUsers();
const notification = new MaintenanceNotification({
  maintenanceTime: new Date(),
  affectedServices: ['database', 'api']
});

await notificationFactory.sendBatch(
  users.map(user => ({ notifiable: user, notification }))
);
```

### 5. Custom Channel Implementation
```typescript
import { NotificationChannel } from '@core/notifications/NotificationChannel';
import { Notification } from '@core/notifications/Notification';

export class SlackChannel implements NotificationChannel {
  async send(notifiable: any, notification: Notification): Promise<void> {
    const slackData = notification.toSlack ? notification.toSlack(notifiable) : null;
    if (!slackData) return;
    
    await this.slackService.sendMessage({
      channel: notifiable.slackChannel,
      text: slackData.message,
      attachments: slackData.attachments
    });
  }
}

// Register the channel
notificationManager.registerChannel('slack', new SlackChannel());
```

## Integration with Existing System

### 1. Enhanced UserSigninListener
The existing `UserSigninListener` has been enhanced to use the new notification system:

```typescript
// Before (existing system)
await this.sendNotificationUseCase.execute({
  userId: event.payload.userId,
  type: 'USER_SIGNIN',
  title: result.title,
  body: result.body,
  data: result.data,
});

// After (enhanced with Laravel-style)
const notification = new UserSigninNotification({
  userId: event.payload.userId,
  username: result.data.sender.username,
  // ... other properties
});
await this.notificationManager.send(user, notification);
```

### 2. Channel Registration
Channels are automatically registered in the DI container:

```typescript
// In AppContainers.ts
Container.set('IEmailService', Container.get(SendGridEmailService));
Container.set('EmailChannel', Container.get(EmailChannel));
Container.set('DatabaseChannel', Container.get(DatabaseChannel));
Container.set('FCMChannel', Container.get(FCMChannel));
Container.set('NotificationManager', Container.get(NotificationManager));
Container.set('NotificationFactory', Container.get(NotificationFactory));
```

## Migration Guide

### From Old System to New System

#### Old Way (Event-Only)
```typescript
// User signs in → Event fired → Old listener sends notification
const event = userSignin({ userId: '123' });
await eventEmitter.emit(event);
```

#### New Way (Laravel-Style)
```typescript
// Direct notification (more explicit)
const notification = new UserSigninNotification({ userId: '123', ... });
await notificationFactory.notify(user, notification);

// OR Event-driven with enhanced notifications
const event = userSignin({ userId: '123' });
await eventEmitter.emit(event); // Still works with enhanced listeners
```

## Best Practices

### 1. Notification Class Design
- **Single Responsibility**: Each notification class handles one specific type
- **Descriptive Names**: Use clear names like `OrderCompletedNotification`
- **Minimal Business Logic**: Keep notification logic separate from business rules
- **Channel-Specific Methods**: Implement only the methods for channels you support

### 2. Channel Selection Logic
```typescript
via(notifiable: any): string[] {
  const channels = ['database']; // Always include database
  
  // User preferences
  if (notifiable.notificationSettings?.email) {
    channels.push('email');
  }
  
  // Business logic
  if (this.isHighPriority) {
    channels.push('fcm'); // Immediate delivery
  }
  
  return channels;
}
```

### 3. Data Structure
```typescript
// Good: Consistent data structure
toDatabase(notifiable: any) {
  return {
    title: 'Notification Title',
    body: 'Notification message',
    data: {
      actionUrl: '/action',
      referenceId: this.orderId,
      metadata: { /* relevant data */ }
    }
  };
}

// Good: Channel-specific optimizations
toFCM(notifiable: any) {
  return {
    title: 'Short title for mobile',
    body: 'Brief message',
    data: {
      // Keep data minimal for FCM
      referenceId: this.orderId
    }
  };
}
```

### 4. Error Handling
```typescript
// The notification manager handles channel failures gracefully
// Individual channel failures don't stop other channels
try {
  await notificationManager.send(user, notification);
} catch (error) {
  // Handle notification system errors
  // Individual channel failures are logged but don't throw
}
```

## Configuration

### Environment Variables
```bash
# Email Configuration
MAIL_FROM_ADDRESS=noreply@yourcompany.com
MAIL_FROM_NAME="Your Company"
SENDGRID_API_KEY=your_sendgrid_key

# Firebase Configuration  
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# App Configuration
APP_URL=https://yourapp.com
```

### Channel Settings
```typescript
// Customize channel behavior in notification classes
class NotificationWithCustomChannels extends Notification {
  via(notifiable: any): string[] {
    // Use environment-specific channel selection
    if (process.env.NODE_ENV === 'production') {
      return ['email', 'fcm'];
    } else {
      return ['database']; // Only database in development
    }
  }
}
```

## Testing

### Unit Testing Notifications
```typescript
describe('UserSigninNotification', () => {
  it('should send through correct channels', () => {
    const notification = new UserSigninNotification(userData);
    const channels = notification.via(mockUser);
    
    expect(channels).toContain('database');
    expect(channels).toContain('email');
  });
  
  it('should generate correct email content', () => {
    const notification = new UserSigninNotification(userData);
    const emailData = notification.toMail(mockUser);
    
    expect(emailData.subject).toContain('New Signin');
    expect(emailData.html).toContain(userData.username);
  });
});
```

### Integration Testing
```typescript
it('should send notifications through all channels', async () => {
  const notification = new UserSigninNotification(userData);
  
  await notificationFactory.notify(user, notification);
  
  // Verify database notification
  const dbNotifications = await notificationRepo.listByUser(user.id);
  expect(dbNotifications).toHaveLength(1);
  
  // Verify email was sent (mock email service)
  expect(emailServiceMock.send).toHaveBeenCalled();
  
  // Verify FCM was sent (mock FCM service)  
  expect(fcmServiceMock.sendFCM).toHaveBeenCalled();
});
```

## Benefits of the New System

1. **Explicit and Clear**: Notification logic is explicit and easy to understand
2. **Flexible**: Easy to add new channels or modify existing ones
3. **Testable**: Each notification can be tested independently
4. **Maintainable**: Separation of concerns between business logic and notification delivery
5. **Scalable**: Batch operations and queue-based processing support
6. **Type-Safe**: Full TypeScript support with IntelliSense
7. **Laravel Familiar**: Developers familiar with Laravel will find it intuitive
8. **Backwards Compatible**: Works alongside existing event-driven system

## Future Enhancements

- **SMS Channel**: Twilio SMS integration
- **Webhook Channel**: HTTP callbacks to external services  
- **Slack Channel**: Team communication integration
- **Template System**: Dynamic template rendering
- **Notification Scheduling**: Send notifications at specific times
- **Retry Logic**: Automatic retry for failed notifications
- **Analytics**: Notification delivery tracking and analytics
- **User Preferences**: Granular channel preferences per user
- **A/B Testing**: Test different notification content/styles

This Laravel-style notification system provides a robust, scalable, and developer-friendly foundation for all notification needs in the application.