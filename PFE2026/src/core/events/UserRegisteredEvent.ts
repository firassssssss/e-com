// UserRegisteredEvent.ts
import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface UserRegisteredPayload {
    userId: string;
    email: string;
    name: string;
}

export class UserRegisteredEvent extends BaseDomainEvent<UserRegisteredPayload> {
    constructor(payload: UserRegisteredPayload) {
        super('USER_REGISTERED', payload);
    }
}
