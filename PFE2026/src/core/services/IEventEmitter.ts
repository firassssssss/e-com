import { DomainEvent } from '../events/DomainEvent.js';

export interface IEventEmitter {
  emit(event: DomainEvent): Promise<void>;
}
