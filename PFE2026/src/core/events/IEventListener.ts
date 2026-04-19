import { DomainEvent } from './DomainEvent.js';

/**
 * Base interface for all event listeners.
 * Each listener should handle a specific event type with typed payload.
 */
export interface IEventListener<TPayload = any> {
  /**
   * Handles the domain event with the specified payload type.
   * @param event The domain event to handle
   * @returns Promise that resolves when the event has been processed
   */
  handle(event: DomainEvent<TPayload>): Promise<void>;
}

/**
 * Marker interface for event listeners that should be executed in parallel.
 * By default, listeners are executed sequentially to maintain order.
 */
export interface IParallelEventListener<TPayload = any> extends IEventListener<TPayload> {
  readonly parallel: true;
}

/**
 * Marker interface for event listeners that should be executed with retry logic.
 */
export interface IRetryableEventListener<TPayload = any> extends IEventListener<TPayload> {
  readonly retryable: true;
  readonly maxRetries?: number;
}
