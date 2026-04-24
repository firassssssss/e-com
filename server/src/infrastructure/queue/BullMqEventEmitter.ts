import { Service } from 'typedi';
import { IEventEmitter } from '../../core/services/IEventEmitter.js';
import { DomainEvent } from '../../core/events/DomainEvent.js';
import { enqueueEvent } from './eventsQueue.js';

/**
 * Concrete EventEmitter that publishes events to the BullMQ `domain-events` queue.
 */
@Service()
export class BullMqEventEmitter implements IEventEmitter {
  async emit(event: DomainEvent): Promise<void> {
    await enqueueEvent(event);
  }
}
