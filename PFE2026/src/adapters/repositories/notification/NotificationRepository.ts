import { Service } from 'typedi';
import { INotificationRepository } from '../../../core/repositories/INotificationRepository.js';
import { Notification } from '../../../core/entities/Notification.js';
import { db } from '../../../infrastructure/db/index.js';
import { notification as notificationTable } from '../../../infrastructure/db/schema/index.js';
import { NotificationMapper } from './mappers/NotificationMapper.js';
import { eq, desc, and, inArray, not } from 'drizzle-orm';

@Service()
export class NotificationRepository implements INotificationRepository {
  private readonly mapper = new NotificationMapper();

  async create(notif: Notification): Promise<void> {
    await db.insert(notificationTable).values(this.mapper.fromDomain(notif));
  }

  async listByUser(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.userId, userId))
      .orderBy(desc(notificationTable.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(r => this.mapper.toDomain(r as any));
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notificationTable)
      .set({ read: true })
      .where(and(eq(notificationTable.id, notificationId), eq(notificationTable.userId, userId)));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notificationTable)
      .set({ read: true })
      .where(
        and(
          eq(notificationTable.userId, userId),
          not(inArray(notificationTable.type, ['NEW_DIRECT_INVITE', 'NEW_GROUP_REQUEST']))
        )
      );
  }
}
