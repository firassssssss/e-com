import { ProductVariant, VariantAttributes } from '../../../../core/entities/ProductVariant.js';
import { productVariants } from '../../../../infrastructure/db/schema/productVariants.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbProductVariant = InferSelectModel<typeof productVariants>;
type NewDbProductVariant = InferInsertModel<typeof productVariants>;

export class ProductVariantMapper {
    static toDomain(dbVariant: DbProductVariant): ProductVariant {
        return new ProductVariant(
            dbVariant.id,
            dbVariant.productId,
            dbVariant.sku,
            dbVariant.name,
            dbVariant.attributes as VariantAttributes,
            Number(dbVariant.price),
            dbVariant.compareAtPrice ? Number(dbVariant.compareAtPrice) : null,
            dbVariant.stock,
            dbVariant.lowStockThreshold,
            dbVariant.images || [],
            dbVariant.isActive,
            dbVariant.isDefault,
            dbVariant.createdAt,
            dbVariant.updatedAt
        );
    }

    static toPersistence(variant: ProductVariant): NewDbProductVariant {
        return {
            id: variant.id,
            productId: variant.productId,
            sku: variant.sku,
            name: variant.name,
            attributes: variant.attributes,
            price: variant.price.toString(),
            compareAtPrice: variant.compareAtPrice ? variant.compareAtPrice.toString() : null,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold,
            images: variant.images,
            isActive: variant.isActive,
            isDefault: variant.isDefault,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
        };
    }
}
