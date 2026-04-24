import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface VariantStockLowPayload {
    variantId: string;
    productId: string;
    productName: string;
    variantName: string;
    sku: string;
    currentStock: number;
    threshold: number;
}

export class VariantStockLowEvent extends BaseDomainEvent<VariantStockLowPayload> {
    constructor(payload: VariantStockLowPayload) {
        super('VARIANT_STOCK_LOW', payload);
    }
}
