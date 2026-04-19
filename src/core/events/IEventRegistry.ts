import { IEventListener } from './IEventListener.js';
import { NotificationEventPayloadMap } from './NotificationEvents.js';

/**
 * Registry for managing event listeners.
 * Allows registration and retrieval of multiple listeners per event type.
 */
export interface IEventRegistry {
  /**
   * Register a listener for a specific event type.
   * Multiple listeners can be registered for the same event type.
   * 
   * @param eventType The event type to listen for
   * @param listener The listener instance to register
   */
  register<K extends keyof NotificationEventPayloadMap>(
    eventType: K,
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void;

  /**
   * Register a listener for a specific event type using a string.
   * This is useful for dynamic registration or when event types are not in the main map.
   * 
   * @param eventType The event type string to listen for
   * @param listener The listener instance to register
   */
  registerString(
    eventType: string,
    listener: IEventListener<any>
  ): void;

  /**
   * Get all listeners registered for a specific event type.
   * 
   * @param eventType The event type to get listeners for
   * @returns Array of listeners registered for the event type
   */
  getListeners<K extends keyof NotificationEventPayloadMap>(
    eventType: K
  ): IEventListener<NotificationEventPayloadMap[K]>[];

  /**
   * Get all listeners registered for a specific event type using a string.
   * 
   * @param eventType The event type string to get listeners for
   * @returns Array of listeners registered for the event type
   */
  getListenersString(eventType: string): IEventListener<any>[];

  /**
   * Unregister a specific listener for an event type.
   * 
   * @param eventType The event type to unregister from
   * @param listener The listener instance to unregister
   */
  unregister<K extends keyof NotificationEventPayloadMap>(
    eventType: K,
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void;

  /**
   * Get all registered event types.
   * 
   * @returns Array of all event types that have registered listeners
   */
  getEventTypes(): string[];

  /**
   * Clear all listeners for a specific event type.
   * 
   * @param eventType The event type to clear listeners for
   */
  clear<K extends keyof NotificationEventPayloadMap>(eventType: K): void;

  /**
   * Clear all listeners for all event types.
   */
  clearAll(): void;
}
