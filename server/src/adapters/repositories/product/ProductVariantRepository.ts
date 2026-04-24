import { Service } from 'typedi';
import { IProductVariantRepository } from '../../../core/repositories/IProductVariantRepository.js';
import { ProductVariant } from '../../../core/entities/ProductVariant.js';
import { getDb } from '../../../infrastructure/db/index.js';
import { productVariants } from '../../../infrastructure/db/schema/productVariants.js';
import { eq, and } from 'drizzle-orm';
import { ProductVariantMapper } from './mappers/ProductVariantMapper.js';

@Service()
export class ProductVariantRepository implements IProductVariantRepository {
    async findById(id: string): Promise<ProductVariant | null> {
        const result = await getDb().select().from(productVariants).where(eq(productVariants.id, id));
        return result[0] ? ProductVariantMapper.toDomain(result[0]) : null;
    }

    async findBySku(sku: string): Promise<ProductVariant | null> {
        const result = await getDb().select().from(productVariants).where(eq(productVariants.sku, sku));
        return result[0] ? ProductVariantMapper.toDomain(result[0]) : null;
    }

    async findByProductId(productId: string): Promise<ProductVariant[]> {
        const result = await getDb().select().from(productVariants).where(eq(productVariants.productId, productId));
        return result.map(ProductVariantMapper.toDomain);
    }

    async findDefaultVariant(productId: string): Promise<ProductVariant | null> {
        const result = await getDb()
            .select()
            .from(productVariants)
            .where(and(eq(productVariants.productId, productId), eq(productVariants.isDefault, true)));
        return result[0] ? ProductVariantMapper.toDomain(result[0]) : null;
    }

    async findLowStockVariants(): Promise<ProductVariant[]> {
        const all = await getDb().select().from(productVariants);
        return all
            .map(ProductVariantMapper.toDomain)
            .filter((v: ProductVariant) => v.isLowStock());
    }

    async create(variant: ProductVariant): Promise<ProductVariant> {
        const dbVariant = ProductVariantMapper.toPersistence(variant);
        const result = await getDb().insert(productVariants).values(dbVariant).returning();
        return ProductVariantMapper.toDomain(result[0]);
    }

    async update(variant: ProductVariant): Promise<ProductVariant> {
        const dbVariant = ProductVariantMapper.toPersistence(variant);
        const result = await getDb()
            .update(productVariants)
            .set(dbVariant)
            .where(eq(productVariants.id, variant.id))
            .returning();
        return ProductVariantMapper.toDomain(result[0]);
    }

    async reduceStock(id: string, quantity: number): Promise<void> {
        const variant = await this.findById(id);
        if (variant) {
            variant.stock -= quantity;
            await this.update(variant);
        }
    }

    async delete(id: string): Promise<void> {
        await getDb().delete(productVariants).where(eq(productVariants.id, id));
    }
}
