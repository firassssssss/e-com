import { BaseDomainEvent } from './BaseDomainEvent.js';
// OrderPlacedEvent.ts
export interface OrderPlacedPayload {
    orderId: string;
    userId: string;
    totalAmount: number;
}

export class OrderPlacedEvent extends BaseDomainEvent<OrderPlacedPayload> {
    constructor(payload: OrderPlacedPayload) {
        super('ORDER_PLACED', payload);
    }
}
