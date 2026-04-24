import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Category } from '../../entities/Category.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';

export interface UpdateCategoryInput {
    id: string;
    name?: string;
    description?: string;
    parentId?: string | null;
    displayOrder?: number;
    isActive?: boolean;
}

export interface IUpdateCategoryUseCase {
    execute(input: UpdateCategoryInput): Promise<Result<Category>>;
}

@Service()
export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(input: UpdateCategoryInput): Promise<Result<Category>> {
        const category = await this.categoryRepository.findById(input.id);
        if (!category) {
            return ResultHelper.failure('Category not found', ErrorCode.NOT_FOUND);
        }

        if (input.name) {
            category.name = input.name;
            // Update slug if name changes? Usually yes, but might break URLs.
            // For now, let's auto-update slug to keep it consistent.
            category.slug = input.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            // Check for conflict on new slug
            const existing = await this.categoryRepository.findBySlug(category.slug);
            if (existing && existing.id !== category.id) {
                return ResultHelper.failure('Category with this name already exists', ErrorCode.CONFLICT);
            }
        }

        if (input.description !== undefined) category.description = input.description;
        if (input.parentId !== undefined) category.parentId = input.parentId;
        if (input.displayOrder !== undefined) category.displayOrder = input.displayOrder;
        if (input.isActive !== undefined) category.isActive = input.isActive;

        category.updatedAt = new Date();

        const updated = await this.categoryRepository.update(category);
        return ResultHelper.success(updated);
    }
}
