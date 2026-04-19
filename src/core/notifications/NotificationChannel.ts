/**
 * Base interface for all notification channels.
 * Similar to Laravel's Illuminate\Contracts\Notifications\Channel interface.
 */
export interface NotificationChannel {
  /**
   * Send the given notification.
   * @param notifiable - The entity being notified
   * @param notification - The notification instance
   * @returns Promise that resolves when the notification is sent
   */
  send(notifiable: any, notification: any): Promise<void>;
}

/**
 * Interface for channels that provide a custom identifier
 */
export interface NamedNotificationChannel extends NotificationChannel {
  /**
   * Get the channel name/identifier
   */
  get name(): string;
}

/**
 * Available channel types
 */
export type ChannelType = 
  | 'database'
  | 'mail'
  | 'fcm'
  | 'sms'
  | 'slack'
  | 'webhook'
  | 'custom';

/**
 * Channel configuration
 */
export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  settings?: Record<string, any>;
}
