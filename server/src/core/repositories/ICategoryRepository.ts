import { Category } from '../entities/Category.js';

export interface ICategoryRepository {
    findById(id: string): Promise<Category | null>;
    findAll(): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category | null>;
    findByParentId(parentId: string | null): Promise<Category[]>;
    findRootCategories(): Promise<Category[]>;
    findSubcategories(parentId: string): Promise<Category[]>;
    getCategoryTree(): Promise<Category[]>; // Hierarchical structure could be represented differently, but keeping it simple for now or returning flat list ordered
    create(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    delete(id: string): Promise<void>;
}
