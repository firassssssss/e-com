import { Inject, Service } from 'typedi';
import { NotificationChannel } from '../NotificationChannel.js';
import { Notification } from '../Notification.js';
import { INotificationSender } from '../../services/INotificationSender.js';
import { IDeviceTokenRepository } from '../../repositories/IDeviceTokenRepository.js';

export interface FCMData {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  clickAction?: string;
  sound?: string;
  badge?: number;
}

/**
 * FCM (Firebase Cloud Messaging) notification channel implementation
 * This enhances the existing FCM service with Laravel-style patterns
 */
@Service()
export class FCMChannel implements NotificationChannel {
  constructor(
    @Inject('INotificationSender') private readonly notificationSender: INotificationSender,
    @Inject('IDeviceTokenRepository') private readonly deviceTokenRepository: IDeviceTokenRepository,
  ) {}

  async send(notifiable: any, notification: Notification): Promise<void> {
    // Check if notification supports FCM channel
    const fcmData = notification.toFCM ? notification.toFCM(notifiable) : null;
    if (!fcmData) {
      console.warn(`Notification ${notification.constructor.name} does not support FCM channel`);
      return;
    }

    // Get user IDs from notifiable entity
    const userIds = this.getUserIds(notifiable);
    if (!userIds.length) {
      console.warn('No valid user IDs found for FCM notification');
      return;
    }

    // Send FCM notifications to all users
    for (const userId of userIds) {
      try {
        // Get device tokens for this user
        const tokens = await this.deviceTokenRepository.listByUser(userId);
        
        if (!tokens.length) {
          console.warn(`No device tokens found for user ${userId}`);
          continue;
        }

        // Prepare data payload
        const dataPayload = {
          ...fcmData.data,
          notificationId: notification.id,
          notificationClass: notification.constructor.name,
          type: notification.type,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          ...(fcmData.imageUrl && { image: fcmData.imageUrl }),
        };

        // Send the FCM notification
        await this.notificationSender.sendFCM(
          tokens,
          fcmData.title,
          fcmData.body,
          dataPayload
        );

        console.log(`FCM notification sent to ${tokens.length} devices for user ${userId}`);
      } catch (error) {
        console.error(`Failed to send FCM notification to user ${userId}:`, error);
        // Continue sending to other users even if one fails
      }
    }
  }

  private getUserIds(notifiable: any): string[] {
    const userIds: string[] = [];

    // Single user with userId property
    if (notifiable.userId) {
      userIds.push(notifiable.userId);
    }

    // Array of users
    if (Array.isArray(notifiable.users)) {
      notifiable.users.forEach((user: any) => {
        if (user.id || user.userId) {
          userIds.push(user.id || user.userId);
        }
      });
    }

    // Notifiable itself might be a user
    if (notifiable.id && this.isUserLike(notifiable)) {
      userIds.push(notifiable.id);
    }

    // Collection-like objects with users
    if (notifiable.users && typeof notifiable.users === 'object' && notifiable.users.length > 0) {
      if (Array.isArray(notifiable.users)) {
        notifiable.users.forEach((user: any) => {
          if (user.id || user.userId) {
            userIds.push(user.id || user.userId);
          }
        });
      }
    }

    return userIds;
  }

  private isUserLike(entity: any): boolean {
    // Check if the entity has user-like properties
    return entity && (
      (entity.email || entity.phoneNumber) && 
      (entity.fullName || entity.username)
    );
  }
}
