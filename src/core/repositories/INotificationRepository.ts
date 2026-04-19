import { Notification } from '../entities/Notification.js';

export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  listByUser(userId: string, limit: number, offset: number): Promise<Notification[]>;
  markRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void> 
}
