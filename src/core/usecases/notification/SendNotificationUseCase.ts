import { Inject, Service } from 'typedi';
import { INotificationRepository } from '../../repositories/INotificationRepository.js';
import { IDeviceTokenRepository } from '../../repositories/IDeviceTokenRepository.js';
import { INotificationSender } from '../../services/INotificationSender.js';
import { ILogger } from '../../services/ILogger.js';
import { Notification } from '../../entities/Notification.js';
import { v4 as uuid } from 'uuid';
import { NotificationEventType } from '../../events/NotificationEvents.js';
import { IUseCase } from '../IUseCase.js';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';

export interface SendNotificationInput {
  userId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export type SendNotificationOutput = {
  success: boolean;
};

@Service()
export class SendNotificationUseCase implements IUseCase<SendNotificationInput, Result<SendNotificationOutput>> {
  constructor(
    @Inject('INotificationRepository') private readonly notificationRepo: INotificationRepository,
    @Inject('IDeviceTokenRepository') private readonly tokenRepo: IDeviceTokenRepository,
    @Inject('INotificationSender') private readonly sender: INotificationSender,
    @Inject('IRequestLogger') private readonly logger: ILogger,
  ) {}

  async execute(input: SendNotificationInput) {
    this.logger.info('Starting notification send process', { 
      userId: input.userId, 
      type: input.type,
      title: input.title 
    });

    const notification = new Notification(
      uuid(),
      input.userId,
      input.type,
      input.title,
      input.body,
      input.data || {},
      false,
      new Date(),
    );

    this.logger.debug('Created notification entity', { notificationId: notification.id });

    await this.notificationRepo.create(notification);
    this.logger.info('Notification saved to database', { notificationId: notification.id });

    const tokens = await this.tokenRepo.listByUser(input.userId);
    this.logger.debug('Retrieved device tokens', { tokenCount: tokens.length });

    try {
      if (tokens.length > 0) {
        await this.sender.sendFCM(tokens, input.title, input.body, {
          type: input.type,
          json: JSON.stringify(input.data || {}),
        });
        this.logger.info('FCM notification sent successfully', { 
          tokenCount: tokens.length,
          notificationId: notification.id 
        });
      } else {
        this.logger.warn('No device tokens found for user', { userId: input.userId });
      }
    } catch (error) {
      this.logger.error('Failed to send FCM notification', error as Error, { 
        userId: input.userId,
        notificationId: notification.id 
      });
      return ResultHelper.failure('Failed to send notification', ErrorCode.INTERNAL_ERROR);
    }
    
    this.logger.info('Notification process completed successfully', { notificationId: notification.id });
    return ResultHelper.success({ success: true });
  }
}
