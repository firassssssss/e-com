import { Container, Service } from 'typedi';
import { IEventRegistry } from '../../core/events/IEventRegistry.js';
import { IEventListener } from '../../core/events/IEventListener.js';
import { NotificationEventPayloadMap } from '../../core/events/NotificationEvents.js';
import { EVENT_LISTENER_MAP, ListenerConstructor } from './index.js';

/**
 * In-memory implementation of the event registry.
 * Manages listeners for domain events with type safety.
 */
@Service()
export class EventRegistry implements IEventRegistry {
  private readonly listeners = new Map<string, IEventListener<any>[]>();

  /**
   * Initialize the registry using the EVENT_LISTENER_MAP.
   * This instantiates each listener via TypeDI and registers it for the corresponding event type.
   */
  initialize(): void {
    console.log('[EventRegistry] Initializing event listeners...');

    for (const [eventType, listenerConstructors] of Object.entries(EVENT_LISTENER_MAP)) {
      for (const constructor of listenerConstructors) {
        try {
          const listener = Container.get(constructor) as IEventListener<any>;
          this.registerString(eventType, listener);
        } catch (error) {
          console.error(`[EventRegistry] Failed to instantiate listener ${constructor.name} for event ${eventType}:`, error);
        }
      }
    }

    console.log(`[EventRegistry] Initialization complete. Registered ${this.getEventTypes().length} event types.`);
  }

  register<K extends keyof NotificationEventPayloadMap>(
    eventType: K,
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void {
    this.registerString(eventType as string, listener);
  }

  registerString(eventType: string, listener: IEventListener<any>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const eventListeners = this.listeners.get(eventType)!;

    // Prevent duplicate registrations
    if (!eventListeners.includes(listener)) {
      eventListeners.push(listener);
      console.log(`[EventRegistry] Registered listener for event type: ${eventType}`);
    } else {
      console.warn(`[EventRegistry] Listener already registered for event type: ${eventType}`);
    }
  }

  getListeners<K extends keyof NotificationEventPayloadMap>(
    eventType: K
  ): IEventListener<NotificationEventPayloadMap[K]>[] {
    return this.getListenersString(eventType as string);
  }

  getListenersString(eventType: string): IEventListener<any>[] {
    return this.listeners.get(eventType) || [];
  }

  unregister<K extends keyof NotificationEventPayloadMap>(
    eventType: K,
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void {
    const eventListeners = this.listeners.get(eventType as string);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
        console.log(`[EventRegistry] Unregistered listener for event type: ${eventType}`);

        // Clean up empty arrays
        if (eventListeners.length === 0) {
          this.listeners.delete(eventType as string);
        }
      }
    }
  }

  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  clear<K extends keyof NotificationEventPayloadMap>(eventType: K): void {
    this.listeners.delete(eventType as string);
    console.log(`[EventRegistry] Cleared all listeners for event type: ${eventType}`);
  }

  clearAll(): void {
    const eventTypes = this.getEventTypes();
    this.listeners.clear();
    console.log(`[EventRegistry] Cleared all listeners for ${eventTypes.length} event types`);
  }

  /**
   * Get registry statistics for debugging/monitoring.
   */
  getStats(): { eventTypes: number; totalListeners: number; listenersByEvent: Record<string, number> } {
    const listenersByEvent: Record<string, number> = {};
    let totalListeners = 0;

    for (const [eventType, listeners] of this.listeners.entries()) {
      listenersByEvent[eventType] = listeners.length;
      totalListeners += listeners.length;
    }

    return {
      eventTypes: this.listeners.size,
      totalListeners,
      listenersByEvent,
    };
  }
}
