export interface DomainEvent<T = any> {
  /**
   * Discriminator string identifying the event type, e.g. 'USER_JOINED_GROUP'.
   */
  type: string;
  /**
   * Payload specific to the event type. Avoid circular references / big objects.
   */
  payload: T;
  /**
   * When the event occurred (ISO string or Date serialised). Defaults to now.
   */
  occurredAt: string;
}

/**
 * Helper to create a DomainEvent with the current timestamp.
 */
export function createEvent<T = any>(type: string, payload: T): DomainEvent<T> {
  return { type, payload, occurredAt: new Date().toISOString() };
}
