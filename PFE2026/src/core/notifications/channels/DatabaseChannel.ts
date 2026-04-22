import { Inject, Service } from 'typedi';
import { NotificationChannel } from '../NotificationChannel.js';
import { Notification } from '../Notification.js';
import { INotificationRepository } from '../../repositories/INotificationRepository.js';
import { Notification as DomainNotification } from '../../entities/Notification.js';
import { v4 as uuid } from 'uuid';

/**
 * Database notification channel implementation
 * This uses the existing notification repository but enhances it with Laravel-style patterns
 */
@Service()
export class DatabaseChannel implements NotificationChannel {
  constructor(
    @Inject('INotificationRepository') private readonly notificationRepository: INotificationRepository,
  ) {}

  async send(notifiable: any, notification: Notification): Promise<void> {
    // Check if notification supports database channel
    const databaseData = notification.toDatabase ? notification.toDatabase(notifiable) : null;
    if (!databaseData) {
      console.warn(`Notification ${notification.constructor.name} does not support database channel`);
      return;
    }

    // Get user ID from notifiable entity
    const userIds = this.getUserIds(notifiable);
    if (!userIds.length) {
      console.warn('No valid user IDs found for database notification');
      return;
    }

    // Create database notifications for all users
    for (const userId of userIds) {
      try {
        const notificationEntity = new DomainNotification(
          uuid(),
          userId,
          notification.type,
          databaseData.title || this.getDefaultTitle(notification),
          databaseData.body || this.getDefaultBody(notification),
          {
            ...databaseData.data,
            notificationId: notification.id,
            notificationClass: notification.constructor.name,
            type: notification.type,
          },
          false, // not read by default
          notification.createdAt || new Date(),
        );

        await this.notificationRepository.create(notificationEntity);
        console.log(`Database notification created for user ${userId} for ${notification.constructor.name}`);
      } catch (error) {
        console.error(`Failed to create database notification for user ${userId}:`, error);
        // Continue creating notifications for other users even if one fails
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

  private getDefaultTitle(notification: Notification): string {
    // Extract a sensible default title from the notification class name
    const className = notification.constructor.name;
    // Convert "UserSigninNotification" to "User Signin Notification"
    return className
      .replace(/Notification$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getDefaultBody(notification: Notification): string {
    // Create a default body message
    const title = this.getDefaultTitle(notification);
    return `You have a new ${title.toLowerCase()} notification.`;
  }
}
