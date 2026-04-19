import { Service } from 'typedi';
import { IEventRegistry } from './IEventRegistry.js';
import { IEventListener } from './IEventListener.js';
import { NotificationEventPayloadMap } from './NotificationEvents.js';

@Service('IEventRegistry')
export class EventRegistry implements IEventRegistry {
  // This Map is the "storage" for all your handlers
  private listeners: Map<string, IEventListener<any>[]> = new Map();

  register<K extends keyof NotificationEventPayloadMap>(
    eventType: K,
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void {
    this.registerString(eventType as string, listener);
  }

  registerString(eventType: string, listener: IEventListener<any>): void {
    const existing = this.listeners.get(eventType) || [];
    this.listeners.set(eventType, [...existing, listener]);
    console.log(`[EventRegistry] Registered handler for: ${eventType}`);
  }

  getListenersString(eventType: string): IEventListener<any>[] {
    return this.listeners.get(eventType) || [];
  }

  getListeners<K extends keyof NotificationEventPayloadMap>(
    eventType: K
  ): IEventListener<NotificationEventPayloadMap[K]>[] {
    return this.getListenersString(eventType as string);
  }

  // Implementation of other methods...
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  clearAll(): void {
    this.listeners.clear();
  }

  unregister<K extends keyof NotificationEventPayloadMap>(
    eventType: K, 
    listener: IEventListener<NotificationEventPayloadMap[K]>
  ): void {
    const existing = this.listeners.get(eventType as string);
    if (existing) {
      this.listeners.set(
        eventType as string, 
        existing.filter(l => l !== listener)
      );
    }
  }

  clear<K extends keyof NotificationEventPayloadMap>(eventType: K): void {
    this.listeners.delete(eventType as string);
  }
}
