import { RedisOptions } from 'bullmq';

export function redisConnection(): RedisOptions {
  return {
    host: '127.0.0.1',
    port: 6379,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    family: 4,
  };
}

export function createRedisConnectionWithLogging(): RedisOptions {
  console.log('[Redis] Creating connection with enhanced stability settings');
  return redisConnection();
}