export interface IDeviceTokenRepository {
  add(userId: string, token: string): Promise<void>;
  listByUser(userId: string): Promise<string[]>;
  remove(token: string): Promise<void>;
}
