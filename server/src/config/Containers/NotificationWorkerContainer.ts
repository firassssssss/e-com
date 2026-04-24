import { DeviceTokenRepository } from '../../adapters/repositories/deviceToken/DeviceTokenRepository.js';
import { NotificationRepository } from '../../adapters/repositories/notification/NotificationRepository.js';
import { IDeviceTokenRepository } from '../../core/repositories/IDeviceTokenRepository.js';
import { INotificationRepository } from '../../core/repositories/INotificationRepository.js';
import { INotificationSender } from '../../core/services/INotificationSender.js';
import { FirebaseMessagingService } from '../../infrastructure/services/FirebaseMessagingService.js';
import { Container } from "typedi";

Container.set('INotificationRepository', Container.get(NotificationRepository) as INotificationRepository);
Container.set('IDeviceTokenRepository', Container.get(DeviceTokenRepository) as IDeviceTokenRepository);
Container.set('INotificationSender', Container.get(FirebaseMessagingService) as INotificationSender);


export default Container;
