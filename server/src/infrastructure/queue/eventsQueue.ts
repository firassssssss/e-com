import { DomainEvent } from '../../core/events/DomainEvent.js';

export const eventsQueueName = 'domain-events';
export const eventsQueue = null;

export async function enqueueEvent(event: DomainEvent) {
  console.warn('[EventsQueue] Skipping event (Redis disabled):', event.type);
}