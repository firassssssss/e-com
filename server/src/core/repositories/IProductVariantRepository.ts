import { ProductVariant } from '../entities/ProductVariant.js';

export interface IProductVariantRepository {
    findById(id: string): Promise<ProductVariant | null>;
    findBySku(sku: string): Promise<ProductVariant | null>;
    findByProductId(productId: string): Promise<ProductVariant[]>;
    findDefaultVariant(productId: string): Promise<ProductVariant | null>;
    findLowStockVariants(): Promise<ProductVariant[]>;
    create(variant: ProductVariant): Promise<ProductVariant>;
    update(variant: ProductVariant): Promise<ProductVariant>;
    reduceStock(id: string, quantity: number): Promise<void>;
    delete(id: string): Promise<void>;
}
