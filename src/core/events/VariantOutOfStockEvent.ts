import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface VariantOutOfStockPayload {
    variantId: string;
    productId: string;
    productName: string;
    variantName: string;
    sku: string;
}

export class VariantOutOfStockEvent extends BaseDomainEvent<VariantOutOfStockPayload> {
    constructor(payload: VariantOutOfStockPayload) {
        super('VARIANT_OUT_OF_STOCK', payload);
    }
}
