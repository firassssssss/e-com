import * as dotenv from 'dotenv';
dotenv.config();

// In-memory Redis mock for Sprint 1 (supports basic operations)
const memoryStore = new Map<string, { value: string; expiry?: number }>();

export const redis = {
  isOpen: true,
  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    const expiry = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    memoryStore.set(key, { value, expiry });
    return 'OK';
  },
  async setex(key: string, seconds: number, value: string): Promise<string> {
    memoryStore.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  },
  async del(key: string): Promise<number> {
    return memoryStore.delete(key) ? 1 : 0;
  },
  async incr(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current + 1;
    memoryStore.set(key, { value: String(next), expiry: entry?.expiry });
    return next;
  },
  async expire(key: string, seconds: number): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    memoryStore.set(key, entry);
    return 1;
  },
  on: () => {},
} as any;

export default redis;
