import { Service } from 'typedi';
import { NotificationFactory } from '../NotificationFactory.js';
import { UserSigninNotification } from '../UserSigninNotification.js';
import { NotificationManager } from '../NotificationManager.js';

/**
 * Integration Example - Shows how to use the new Laravel-style notification system
 * This demonstrates integration with the existing event-driven architecture
 */
@Service()
export class IntegrationExample {
  constructor(
    private readonly notificationFactory: NotificationFactory,
    private readonly notificationManager: NotificationManager,
  ) {}

  /**
   * Example 1: Direct notification sending (Laravel-style)
   * This is the new way - more explicit and easier to understand
   */
  async exampleDirectNotification(): Promise<void> {
    console.log('Example 1: Direct Notification Sending');

    // Find or create a user
    const user = await this.getOrCreateUser();

    // Create a notification instance
    const notification = new UserSigninNotification({
      userId: user.id,
      username: user.username,
      profilePicUrl: user.profilePicUrl,
      ipAddress: '192.168.1.100',
      deviceInfo: 'Chrome on Windows',
    });

    // Send the notification through configured channels
    await this.notificationFactory.notify(user, notification);
    console.log('✓ Direct notification sent successfully\n');
  }

  /**
   * Example 2: Event-driven notification (existing system integration)
   * This shows how the new system works with existing domain events
   */
  async exampleEventDrivenNotification(): Promise<void> {
    console.log('Example 2: Event-Driven Notification (with new system)');

    // Simulate an existing event being fired
    const user = await this.getOrCreateUser();
    
    // Create notification from event (this would normally happen in event listener)
    const eventType = 'USER_SIGNIN';
    const eventData = {
      userId: user.id,
      username: user.username,
      profilePicUrl: user.profilePicUrl,
      ipAddress: '192.168.1.101',
      deviceInfo: 'Safari on iPhone',
    };

    // Create notification from event
    const notification = this.notificationFactory.createNotificationFromEvent(eventType, eventData);
    
    if (notification) {
      // Send through notification manager (which also fires events)
      await this.notificationManager.send(user, notification);
      console.log('✓ Event-driven notification sent successfully\n');
    }
  }

  /**
   * Example 3: Multi-channel notification
   * Send the same notification through multiple channels
   */
  async exampleMultiChannelNotification(): Promise<void> {
    console.log('Example 3: Multi-Channel Notification');

    const user = await this.getOrCreateUser();

    // Create notification with rich content
    const notification = new UserSigninNotification({
      userId: user.id,
      username: user.username,
      profilePicUrl: user.profilePicUrl,
      ipAddress: '192.168.1.102',
      deviceInfo: 'Firefox on Android',
      signinTime: new Date(),
    });

    // The notification will automatically determine channels via the via() method
    // But we can also manually override or check what channels will be used
    const channels = notification.via(user);
    console.log(`Notification will be sent through channels: ${channels.join(', ')}`);

    await this.notificationFactory.notify(user, notification);
    console.log('✓ Multi-channel notification sent successfully\n');
  }

  /**
   * Example 4: Batch notifications
   * Send multiple notifications to multiple users
   */
  async exampleBatchNotifications(): Promise<void> {
    console.log('Example 4: Batch Notifications');

    // Create multiple users
    const users = await Promise.all([
      this.getOrCreateUser('user1'),
      this.getOrCreateUser('user2'),
      this.getOrCreateUser('user3'),
    ]);

    // Create notifications for each user
    const notifications = users.map(user => ({
      notifiable: user,
      notification: new UserSigninNotification({
        userId: user.id,
        username: user.username,
        ipAddress: '192.168.1.103',
        deviceInfo: 'Chrome on Mac',
      }),
    }));

    // Send batch
    await this.notificationFactory.sendBatch(notifications);
    console.log('✓ Batch notifications sent successfully\n');
  }

  /**
   * Example 5: Custom notification class
   * Show how to create your own notification types
   */
  async exampleCustomNotification(): Promise<void> {
    console.log('Example 5: Custom Notification');

    const user = await this.getOrCreateUser();

    // Create a custom notification (simplified for demo)
    const customNotification = new UserSigninNotification({
      userId: user.id,
      username: user.username,
      ipAddress: '192.168.1.104',
      deviceInfo: 'Edge on Windows',
    });

    await this.notificationFactory.notify(user, customNotification);
    console.log('✓ Custom notification sent successfully\n');
  }

  /**
   * Example 6: Using the NotificationManager directly
   * Lower-level access for advanced use cases
   */
  async exampleDirectManagerUsage(): Promise<void> {
    console.log('Example 6: Direct Manager Usage');

    const user = await this.getOrCreateUser();
    const notification = new UserSigninNotification({
      userId: user.id,
      username: user.username,
      ipAddress: '192.168.1.105',
      deviceInfo: 'Safari on macOS',
    });

    // Access channels directly
    const availableChannels = this.notificationManager.getChannels();
    console.log('Available channels:', Array.from(availableChannels.keys()));

    // Send directly through manager
    await this.notificationManager.send(user, notification);
    console.log('✓ Direct manager usage completed successfully\n');
  }

  /**
   * Helper method to get or create a user
   * @param username - Username for the user
   * @returns User object
   */
  private async getOrCreateUser(username: string = 'testuser'): Promise<any> {
    // Try to find existing user (simplified for demo)
    let user: any = null;
    
    // In a real implementation, you would use the repository:
    // user = await this.userRepository.findByUsername(username);
    
    // For demo purposes, create mock user
    user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: username,
      email: `${username}@example.com`,
      fullName: `Test User ${username}`,
      profilePicUrl: `https://example.com/avatar-${username}.jpg`,
      language: 'en',
    };
      
    console.log(`Created mock user: ${username}`);
    
    return user;
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('🚀 Starting Laravel-Style Notification System Examples');
    console.log('='.repeat(60));

    try {
      await this.exampleDirectNotification();
      await this.exampleEventDrivenNotification();
      await this.exampleMultiChannelNotification();
      await this.exampleBatchNotifications();
      await this.exampleCustomNotification();
      await this.exampleDirectManagerUsage();

      console.log('🎉 All examples completed successfully!');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('❌ Error running examples:', error);
      throw error;
    }
  }
}
