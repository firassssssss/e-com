import { createEvent, DomainEvent } from './DomainEvent.js';

/*
 * Type-safe definitions of all notification events and their payload shapes.
 * Extend as new events are added.
 */
// --- Event type union ---
export type NotificationEventType =
  | 'USER_SIGNIN'
  | 'ORDER_PLACED'
  | 'VARIANT_STOCK_LOW'
  | 'VARIANT_OUT_OF_STOCK'
  | 'REVIEW_CREATED'
  | 'REVIEW_APPROVED';


// --- Payload interfaces --- //
export interface UserSigninPayload { userId: string; }
export interface OrderPlacedPayload { orderId: string; userId: string; }
// Define optional payloads as needed later...

// --- Payload map ---
export type NotificationEventPayloadMap = {
  USER_SIGNIN: UserSigninPayload;
  ORDER_PLACED: OrderPlacedPayload;
};

export type NotificationEvent<K extends keyof NotificationEventPayloadMap = keyof NotificationEventPayloadMap> = DomainEvent<NotificationEventPayloadMap[K]> & { type: K };

// --- Factory helpers --- //
export function userSignin(payload: UserSigninPayload) {
  return createEvent('USER_SIGNIN', payload) as NotificationEvent<'USER_SIGNIN'>;
}

export function orderPlaced(payload: OrderPlacedPayload) {
  return createEvent('ORDER_PLACED', payload) as NotificationEvent<'ORDER_PLACED'>;
}
