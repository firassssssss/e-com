import { Service } from 'typedi';
import { ICategoryRepository } from '../../../core/repositories/ICategoryRepository.js';
import { Category } from '../../../core/entities/Category.js';
import { db } from '../../../infrastructure/db/index.js';
import { categories } from '../../../infrastructure/db/schema/categories.js';
import { eq, isNull, asc } from 'drizzle-orm';
import { CategoryMapper } from './mappers/CategoryMapper.js';

@Service()
export class CategoryRepository implements ICategoryRepository {
    async findById(id: string): Promise<Category | null> {
        const result = await db.select().from(categories).where(eq(categories.id, id));
        return result[0] ? CategoryMapper.toDomain(result[0]) : null;
    }

    async findAll(): Promise<Category[]> {
        const result = await db.select().from(categories).orderBy(asc(categories.displayOrder));
        return result.map(CategoryMapper.toDomain);
    }

    async findBySlug(slug: string): Promise<Category | null> {
        const result = await db.select().from(categories).where(eq(categories.slug, slug));
        return result[0] ? CategoryMapper.toDomain(result[0]) : null;
    }

    async findByParentId(parentId: string | null): Promise<Category[]> {
        if (parentId === null) {
            return this.findRootCategories();
        }
        const result = await db
            .select()
            .from(categories)
            .where(eq(categories.parentId, parentId))
            .orderBy(asc(categories.displayOrder));
        return result.map(CategoryMapper.toDomain);
    }

    async findRootCategories(): Promise<Category[]> {
        const result = await db
            .select()
            .from(categories)
            .where(isNull(categories.parentId))
            .orderBy(asc(categories.displayOrder));
        return result.map(CategoryMapper.toDomain);
    }

    async findSubcategories(parentId: string): Promise<Category[]> {
        return this.findByParentId(parentId);
    }

    async getCategoryTree(): Promise<Category[]> {
        // For now, just return all categories. Tree construction can happen in UseCase or client-side.
        // Or we can fetch all and build tree here.
        return this.findAll();
    }

    async create(category: Category): Promise<Category> {
        const dbCategory = CategoryMapper.toPersistence(category);
        const result = await db.insert(categories).values(dbCategory).returning();
        return CategoryMapper.toDomain(result[0]);
    }

    async update(category: Category): Promise<Category> {
        const dbCategory = CategoryMapper.toPersistence(category);
        const result = await db
            .update(categories)
            .set(dbCategory)
            .where(eq(categories.id, category.id))
            .returning();
        return CategoryMapper.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await db.delete(categories).where(eq(categories.id, id));
    }
}
