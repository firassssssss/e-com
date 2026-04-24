import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface AddressCreatedPayload {
    addressId: string;
    userId: string;
    governorate: string;
    city: string;
    isDefault: boolean;
}

export class AddressCreatedEvent extends BaseDomainEvent<AddressCreatedPayload> {
    constructor(payload: AddressCreatedPayload) {
        super('ADDRESS_CREATED', payload);
    }
}
