import { Service } from 'typedi';
import { INotificationSender } from '../../core/services/INotificationSender.js';
import * as admin from 'firebase-admin';

@Service()
export class FirebaseMessagingService implements INotificationSender {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    this.initialized = true;
  }

  async sendFCM(tokens: string[], title: string, body: string, data: Record<string, any> = {}): Promise<void> {
    if (tokens.length === 0) return;
    this.init();
    const message = {
      notification: { title, body },
      data: Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {}),
      tokens,
    } as any;

    try {
      await admin.messaging().sendEachForMulticast(message as any);
    } catch (err) {
      console.error('FCM send error', err);
    }
  }
}
