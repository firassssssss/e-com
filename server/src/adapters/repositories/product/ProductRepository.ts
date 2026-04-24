import { Service } from 'typedi';
import { IProductRepository } from '../../../core/repositories/IProductRepository.js';
import { Product } from '../../../core/entities/Product.js';
import { getDb } from '../../../infrastructure/db/index.js';
import { products } from '../../../infrastructure/db/schema/products.js';
import { eq } from 'drizzle-orm';
import { ProductMapper } from './mappers/ProductMapper.js';

@Service()
export class ProductRepository implements IProductRepository {
    async findById(id: string): Promise<Product | null> {
        const result = await getDb().select().from(products).where(eq(products.id, id));
        return result[0] ? ProductMapper.toDomain(result[0]) : null;
    }

    async findAll(): Promise<Product[]> {
        const result = await getDb().select().from(products);
        return result.map(ProductMapper.toDomain);
    }

    async create(product: Product): Promise<Product> {
        const dbProduct = ProductMapper.toPersistence(product);
        const result = await getDb().insert(products).values(dbProduct).returning();
        return ProductMapper.toDomain(result[0]);
    }

    async update(product: Product): Promise<Product> {
        const dbProduct = ProductMapper.toPersistence(product);
        const result = await getDb()
            .update(products)
            .set(dbProduct)
            .where(eq(products.id, product.id))
            .returning();
        return ProductMapper.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await getDb().delete(products).where(eq(products.id, id));
    }
}
