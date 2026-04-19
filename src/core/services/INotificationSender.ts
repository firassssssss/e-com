export interface INotificationSender {
  sendFCM(tokens: string[], title: string, body: string, data?: Record<string, any>): Promise<void>;
}
