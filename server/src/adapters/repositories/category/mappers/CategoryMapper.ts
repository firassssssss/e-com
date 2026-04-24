import { Category } from '../../../../core/entities/Category.js';
import { categories } from '../../../../infrastructure/db/schema/categories.js'; // Will be fixed to remove .js later if needed, but sticking to pattern
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// We need to handle the recursive type definition carefully or just use the schema type
type DbCategory = InferSelectModel<typeof categories>;
type NewDbCategory = InferInsertModel<typeof categories>;

export class CategoryMapper {
    static toDomain(dbCategory: DbCategory): Category {
        return new Category(
            dbCategory.id,
            dbCategory.name,
            dbCategory.slug,
            dbCategory.description,
            dbCategory.parentId,
            dbCategory.displayOrder,
            dbCategory.isActive,
            dbCategory.createdAt,
            dbCategory.updatedAt
        );
    }

    static toPersistence(category: Category): NewDbCategory {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            parentId: category.parentId,
            displayOrder: category.displayOrder,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}
