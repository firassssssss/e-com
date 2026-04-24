import { Notification } from '../../../../core/entities/Notification.js';
import { notification } from '../../../../infrastructure/db/schema/index.js';
import { InferSelectModel } from 'drizzle-orm';

export class NotificationMapper {
  toDomain(row: InferSelectModel<typeof notification>): Notification {
    return new Notification(
      row.id,
      row.userId,
      row.type,
      row.title,
      row.body,
      row.data ? JSON.parse(row.data) : {},
      row.read,
      row.createdAt,
    );
  }

  fromDomain(entity: Notification): InferSelectModel<typeof notification> {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      body: entity.body,
      data: JSON.stringify(entity.data || {}),
      read: entity.read,
      createdAt: entity.createdAt,
    } as any;
  }
}
