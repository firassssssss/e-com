import { Inject, Service } from 'typedi';
import { Notification } from './Notification.js';
import { NotificationChannel } from './NotificationChannel.js';
import { EmailChannel } from './channels/EmailChannel.js';
import { DatabaseChannel } from './channels/DatabaseChannel.js';
import { FCMChannel } from './channels/FCMChannel.js';
import { IEventEmitter } from '../services/IEventEmitter.js';

/**
 * Notification Manager - Similar to Laravel's Notification facade
 * This class handles sending notifications through multiple channels
 */
@Service()
export class NotificationManager {
  private channelInstances = new Map<string, NotificationChannel>();

  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly databaseChannel: DatabaseChannel,
    private readonly fcmChannel: FCMChannel,
    @Inject('IEventEmitter') private readonly eventEmitter?: IEventEmitter,
  ) {
    // Register available channels
    this.registerChannel('email', this.emailChannel);
    this.registerChannel('mail', this.emailChannel); // Laravel alias
    this.registerChannel('database', this.databaseChannel);
    this.registerChannel('fcm', this.fcmChannel);
  }

  /**
   * Send a notification to the specified notifiable entity
   * This is the main method, similar to Laravel's Notification::send()
   * @param notifiable - The entity to notify (user, etc.)
   * @param notification - The notification instance
   */
  async send(notifiable: any, notification: Notification): Promise<void> {
    // Get channels to send notification through
    const channels = notification.via(notifiable);

    if (!channels.length) {
      console.warn(`No channels specified for notification ${notification.constructor.name}`);
      return;
    }

    console.log(`Sending notification ${notification.constructor.name} through channels: ${channels.join(', ')}`);

    // Send through each specified channel
    const promises = channels.map(channelName =>
      this.sendThroughChannel(channelName, notifiable, notification)
    );

    try {
      await Promise.all(promises);
      console.log(`Notification ${notification.constructor.name} sent successfully through ${channels.length} channels`);
    } catch (error) {
      console.error(`Failed to send notification ${notification.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Send a notification to multiple notifiable entities
   * @param notifiables - Array of entities to notify
   * @param notification - The notification instance
   */
  async sendToMany(notifiables: any[], notification: Notification): Promise<void> {
    if (!Array.isArray(notifiables) || !notifiables.length) {
      console.warn('No notifiables provided for sendToMany');
      return;
    }

    const promises = notifiables.map(notifiable =>
      this.send(notifiable, notification)
    );

    try {
      await Promise.all(promises);
      console.log(`Notification ${notification.constructor.name} sent to ${notifiables.length} recipients`);
    } catch (error) {
      console.error(`Failed to send notification to multiple recipients:`, error);
      throw error;
    }
  }

  /**
   * Register a new channel
   * @param name - Channel name
   * @param channel - Channel instance
   */
  registerChannel(name: string, channel: NotificationChannel): void {
    this.channelInstances.set(name, channel);
    console.log(`Registered notification channel: ${name}`);
  }

  /**
   * Get a registered channel by name
   * @param name - Channel name
   * @returns Channel instance or undefined if not found
   */
  getChannel(name: string): NotificationChannel | undefined {
    return this.channelInstances.get(name);
  }

  /**
   * Get all registered channels
   * @returns Map of channel names to instances
   */
  getChannels(): Map<string, NotificationChannel> {
    return new Map(this.channelInstances);
  }

  /**
   * Send notification through a specific channel
   * @param channelName - Name of the channel
   * @param notifiable - The entity to notify
   * @param notification - The notification instance
   */
  private async sendThroughChannel(channelName: string, notifiable: any, notification: Notification): Promise<void> {
    const channel = this.channelInstances.get(channelName);

    if (!channel) {
      throw new Error(`Notification channel '${channelName}' is not registered`);
    }

    try {
      await channel.send(notifiable, notification);
      console.log(`Notification sent through channel: ${channelName}`);
    } catch (error) {
      console.error(`Failed to send notification through channel '${channelName}':`, error);
      // Continue with other channels even if one fails
    }
  }

  /**
   * Fire an event when a notification is sent (if event emitter is available)
   * This maintains compatibility with the existing event-driven architecture
   * @param notification - The notification that was sent
   * @param channels - The channels used
   * @param notifiable - The entity that was notified
   */
  private async fireNotificationEvent(notification: Notification, channels: string[], notifiable: any): Promise<void> {
    if (!this.eventEmitter) return;

    try {
      // Create a domain event that corresponds to the notification
      const eventType = this.getEventTypeForNotification(notification);
      if (eventType) {
        // Import dynamically to avoid circular dependencies
        const { createEvent } = await import('../events/DomainEvent');
        const event = createEvent(eventType, {
          userId: notifiable.id || notifiable.userId,
          notificationType: notification.type,
          channels,
          data: {
            notificationId: notification.id,
            notificationClass: notification.constructor.name,
          },
        });

        await this.eventEmitter.emit(event);
      }
    } catch (error) {
      console.warn('Failed to fire notification event:', error);
      // Don't throw here - notification sending should continue even if event firing fails
    }
  }

  /**
   * Map notification types to domain events
   * This helps maintain compatibility with the existing event system
   * @param notification - The notification instance
   * @returns Event type string or undefined if no mapping exists
   */
  private getEventTypeForNotification(notification: Notification): string | undefined {
    const className = notification.constructor.name;

    // Map common notification types to events
    const mapping: Record<string, string> = {
      'UserSigninNotification': 'USER_SIGNIN',
      'OrderCompletedNotification': 'ORDER_COMPLETED',
      'PasswordResetNotification': 'PASSWORD_RESET',
      // Add more mappings as needed
    };

    return mapping[className];
  }
}
