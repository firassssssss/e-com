import { Product } from '../../../../core/entities/Product.js';
import { products } from '../../../../infrastructure/db/schema/products.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbProduct = InferSelectModel<typeof products>;
type NewDbProduct = InferInsertModel<typeof products>;

export class ProductMapper {
    static toDomain(dbProduct: DbProduct): Product {
        return new Product(
            dbProduct.id,
            dbProduct.name,
            dbProduct.description,
            dbProduct.price ? Number(dbProduct.price) : null, // Handle nullable
            dbProduct.categoryId,
            dbProduct.brand,
            dbProduct.sku,
            dbProduct.stock, // Nullable
            dbProduct.images || [],
            dbProduct.ingredients || [],
            dbProduct.skinType || [],
            dbProduct.isActive,
            dbProduct.hasVariants,
            Number(dbProduct.averageRating),
            dbProduct.reviewCount,
            dbProduct.createdAt,
            dbProduct.updatedAt
        );
    }

    static toPersistence(product: Product): NewDbProduct {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price ? product.price.toString() : null, // Handle nullable
            categoryId: product.categoryId,
            brand: product.brand,
            sku: product.sku,
            stock: product.stock,
            images: product.images,
            ingredients: product.ingredients,
            skinType: product.skinType,
            isActive: product.isActive,
            hasVariants: product.hasVariants,
            averageRating: product.averageRating.toString(),
            reviewCount: product.reviewCount,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}
