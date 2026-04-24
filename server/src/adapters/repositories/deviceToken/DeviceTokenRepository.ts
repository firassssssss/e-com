import { Service } from 'typedi';
import { IDeviceTokenRepository } from '../../../core/repositories/IDeviceTokenRepository.js';
import { db } from '../../../infrastructure/db/index.js';
import { deviceToken } from '../../../infrastructure/db/schema/index.js';
import { eq } from 'drizzle-orm';

@Service()
export class DeviceTokenRepository implements IDeviceTokenRepository {
  async add(userId: string, token: string): Promise<void> {
    // upsert style: delete duplicates then insert
    await db.delete(deviceToken).where(eq(deviceToken.token, token));
    await db.insert(deviceToken).values({ userId, token });
  }

  async listByUser(userId: string): Promise<string[]> {
    const rows = await db.select({ token: deviceToken.token }).from(deviceToken).where(eq(deviceToken.userId, userId));
    return rows.map(r => r.token);
  }

  async remove(token: string): Promise<void> {
    await db.delete(deviceToken).where(eq(deviceToken.token, token));
  }
}
