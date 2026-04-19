import { Queue } from 'bullmq';
import { createRedisConnectionWithLogging } from './redisConnection.js';
import { DomainEvent } from '../../core/events/DomainEvent.js';

export const eventsQueueName = 'domain-events';

let eventsQueue: Queue | null = null;

try {
  eventsQueue = new Queue(eventsQueueName, {
    connection: createRedisConnectionWithLogging(),
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  eventsQueue.on('error', (error: Error) => {
    console.error('[EventsQueue] Queue/Redis error:', error.message);
  });
} catch (err) {
  console.warn('[EventsQueue] Redis unavailable — queue disabled. Events will be skipped.');
}

export { eventsQueue };

export async function enqueueEvent(event: DomainEvent) {
  if (!eventsQueue) {
    console.warn('[EventsQueue] Skipping event — Redis not available:', event.type);
    return;
  }
  await eventsQueue.add(event.type, event, {
    removeOnComplete: false,
    removeOnFail: false,
  });
}