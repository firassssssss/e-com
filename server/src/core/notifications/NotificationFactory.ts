import { Inject, Service } from 'typedi';
import { NotificationManager } from './NotificationManager.js';
import { Notification } from './Notification.js';
import { UserSigninNotification } from './UserSigninNotification.js';

/**
 * Notification Factory - Provides convenient API for creating and sending notifications
 * This bridges the gap between the new Laravel-style notifications and the existing event system
 */
@Service()
export class NotificationFactory {
  constructor(
    private readonly notificationManager: NotificationManager,
  ) {}

  /**
   * Send a notification (Laravel-style)
   * @param notifiable - The entity to notify
   * @param notification - The notification instance
   */
  async notify(notifiable: any, notification: Notification): Promise<void> {
    await this.notificationManager.send(notifiable, notification);
  }

  /**
   * Send notification to multiple recipients (Laravel-style)
   * @param notifiables - Array of entities to notify
   * @param notification - The notification instance
   */
  async notifyMany(notifiables: any[], notification: Notification): Promise<void> {
    await this.notificationManager.sendToMany(notifiables, notification);
  }

  /**
   * Create and send a UserSigninNotification (for the existing event system)
   * This integrates with the current UserSignin event handler
   * @param userData - User information
   * @param channels - Optional specific channels to use
   */
  async sendUserSigninNotification(
    userData: {
      userId: string;
      username: string;
      profilePicUrl?: string;
      signinTime?: Date;
      ipAddress?: string;
      deviceInfo?: string;
    },
    channels?: string[]
  ): Promise<void> {
    // Create the notification
    const notification = new UserSigninNotification(userData);

    // Find the user to notify (this would normally come from repository)
    const user = await this.findUserById(userData.userId);
    if (!user) {
      console.warn(`User ${userData.userId} not found for signin notification`);
      return;
    }

    // Send the notification
    await this.notificationManager.send(user, notification);
  }

  /**
   * Create and send a custom notification type
   * @param notificationClass - The notification class to instantiate
   * @param constructorArgs - Arguments for the notification constructor
   * @param notifiable - The entity to notify
   */
  async sendCustomNotification(
    notificationClass: new (...args: any[]) => Notification,
    constructorArgs: any[],
    notifiable: any,
  ): Promise<void> {
    // Create the notification instance
    const notification = new notificationClass(...constructorArgs);

    // Send the notification
    await this.notificationManager.send(notifiable, notification);
  }

  /**
   * Batch send notifications (useful for bulk operations)
   * @param notifications - Array of { notifiable, notification } pairs
   * @returns Promise that resolves when all notifications are sent
   */
  async sendBatch(notifications: Array<{ notifiable: any; notification: Notification }>): Promise<void> {
    if (!Array.isArray(notifications) || !notifications.length) {
      console.warn('No notifications provided for batch send');
      return;
    }

    const promises = notifications.map(({ notifiable, notification }) =>
      this.notificationManager.send(notifiable, notification)
    );

    try {
      await Promise.allSettled(promises);
      console.log(`Batch notification send completed for ${notifications.length} notifications`);
    } catch (error) {
      console.error('Batch notification send failed:', error);
      throw error;
    }
  }

  /**
   * Get available channels
   * @returns Array of channel names
   */
  getAvailableChannels(): string[] {
    return Array.from(this.notificationManager.getChannels().keys());
  }

  /**
   * Register a new channel (for dynamic channel addition)
   * @param name - Channel name
   * @param channel - Channel instance
   */
  registerChannel(name: string, channel: any): void {
    this.notificationManager.registerChannel(name, channel);
  }

  /**
   * Create a notification from event data
   * This provides bridge between event system and notifications
   * @param eventType - Event type
   * @param eventData - Event payload data
   * @returns Notification instance or null if no mapping exists
   */
  createNotificationFromEvent(eventType: string, eventData: any): Notification | null {
    const eventToNotificationMapping: Record<string, { notificationClass: new (data: any) => Notification }> = {
      'USER_SIGNIN': {
        notificationClass: UserSigninNotification,
      },
      // Add more mappings as needed
      // 'ORDER_COMPLETED': { notificationClass: OrderCompletedNotification },
      // 'PASSWORD_RESET': { notificationClass: PasswordResetNotification },
    };

    const mapping = eventToNotificationMapping[eventType];
    if (!mapping) {
      console.warn(`No notification mapping found for event type: ${eventType}`);
      return null;
    }

    try {
      return new mapping.notificationClass(eventData);
    } catch (error) {
      console.error(`Failed to create notification for event ${eventType}:`, error);
      return null;
    }
  }

  /**
   * Find user by ID (mock implementation - would use repository in real app)
   * @param userId - User ID
   * @returns User object or null if not found
   * @private
   */
  private async findUserById(userId: string): Promise<any | null> {
    // This is a mock implementation
    // In real implementation, you would inject and use IUserRepository
    // For now, return a mock user object
    return {
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      language: 'en',
      fullName: 'Test User',
    };
  }
}
