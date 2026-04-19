/**
 * Base notification class similar to Laravel's Notification class.
 * Notifications should extend this class and implement the channel-specific methods.
 */
export abstract class Notification {
  /**
   * Determine which channels the notification should be sent on.
   * This is similar to Laravel's via() method.
   * @param notifiable - The entity being notified
   * @returns Array of channel names
   */
  abstract via(notifiable: any): string[];

  /**
   * Get the notification's ID (optional).
   * @returns string
   */
  get id(): string {
    return '';
  }

  /**
   * Get the notification's type/identifier.
   * @returns string
   */
  get type(): string {
    return this.constructor.name;
  }

  /**
   * Get the notification's creation date (optional).
   * @returns Date
   */
  get createdAt(): Date {
    return new Date();
  }

  // Default implementations for channel methods (can be overridden)
  
  /**
   * Database channel representation
   * @param notifiable - The entity being notified
   * @returns object with notification data for database
   */
  toDatabase?(notifiable: any): Record<string, any>;

  /**
   * Mail channel representation (for email)
   * @param notifiable - The entity being notified
   * @returns object with email data
   */
  toMail?(notifiable: any): Record<string, any>;

  /**
   * FCM channel representation
   * @param notifiable - The entity being notified
   * @returns object with FCM data
   */
  toFCM?(notifiable: any): {
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
    clickAction?: string;
    sound?: string;
    badge?: number;
  };

  /**
   * SMS channel representation
   * @param notifiable - The entity being notified
   * @returns object with SMS data
   */
  toSMS?(notifiable: any): {
    message: string;
  };

  /**
   * Custom channel representation
   * @param notifiable - The entity being notified
   * @param channel - The channel name
   * @returns channel-specific data
   */
  toCustom?(notifiable: any, channel: string): Record<string, any>;
}
