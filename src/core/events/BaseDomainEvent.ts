import { DomainEvent } from './DomainEvent.js';

/**
 * Base class for all domain events
 */
export abstract class BaseDomainEvent<T = any> implements DomainEvent<T> {
    readonly type: string;
    readonly payload: T;
    readonly occurredAt: string;

    constructor(type: string, payload: T) {
        this.type = type;
        this.payload = payload;
        this.occurredAt = new Date().toISOString();
    }
}
