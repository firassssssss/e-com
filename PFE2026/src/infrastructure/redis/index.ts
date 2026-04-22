import * as dotenv from 'dotenv';
dotenv.config();

const memoryStore = new Map();

function getEntry(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiry && entry.expiry < Date.now()) { memoryStore.delete(key); return null; }
  return entry.value;
}

export const redisClient = {
  isOpen: true, isReady: true,
  async get(key) { return getEntry(key); },
  async set(key, value, options) {
    const expiry = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    memoryStore.set(key, { value, expiry }); return 'OK';
  },
  async setex(key, seconds, value) {
    memoryStore.set(key, { value, expiry: Date.now() + seconds * 1000 }); return 'OK';
  },
  async del(key) { return memoryStore.delete(key) ? 1 : 0; },
  async incr(key) {
    const e = memoryStore.get(key);
    const n = (e ? parseInt(e.value) || 0 : 0) + 1;
    memoryStore.set(key, { value: String(n), expiry: e?.expiry }); return n;
  },
  async expire(key, seconds) {
    const e = memoryStore.get(key); if (!e) return 0;
    e.expiry = Date.now() + seconds * 1000; memoryStore.set(key, e); return 1;
  },
  async sendCommand(args) {
    const [cmd, ...rest] = args;
    switch (cmd?.toUpperCase()) {
      case 'SET': return this.set(rest[0], rest[1]);
      case 'GET': return this.get(rest[0]);
      case 'INCR': return this.incr(rest[0]);
      case 'EXPIRE': return this.expire(rest[0], parseInt(rest[1]));
      case 'DEL': return this.del(rest[0]);
      case 'PTTL': case 'TTL': {
        const e = memoryStore.get(rest[0]);
        if (!e || !e.expiry) return -1;
        return Math.max(0, Math.ceil((e.expiry - Date.now()) / (cmd === 'PTTL' ? 1 : 1000)));
      }
      case 'EVAL': case 'EVALSHA': {
        const key = rest[2]; const win = parseInt(rest[rest.length - 2]) || 60000;
        const e = memoryStore.get(key); const now = Date.now();
        let count = 1;
        if (e && e.expiry && e.expiry > now) count = parseInt(e.value) + 1;
        memoryStore.set(key, { value: String(count), expiry: now + win });
        return [count, win];
      }
      case 'SCRIPT': return 'mock-sha-1234567890abcdef';
      case 'SCRIPT LOAD': return 'mock-sha-1234567890abcdef';
      default: return null;
    }
  },
  async lpush(key, value) {
    const e = memoryStore.get(key);
    const list = e ? JSON.parse(e.value) : [];
    list.unshift(value);
    memoryStore.set(key, { value: JSON.stringify(list), expiry: undefined });
    return list.length;
  },
  async ltrim(key, start, stop) {
    const e = memoryStore.get(key); if (!e) return 'OK';
    const list = JSON.parse(e.value);
    memoryStore.set(key, { value: JSON.stringify(list.slice(start, stop + 1)), expiry: e.expiry });
    return 'OK';
  },
  async lrange(key, start, stop) {
    const e = getEntry(key); if (!e) return [];
    const list = JSON.parse(e);
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  },
  on: () => redisClient, once: () => redisClient,
  connect: async () => {}, disconnect: async () => {}, quit: async () => 'OK',
};

export const redis = redisClient;
export default redisClient;


