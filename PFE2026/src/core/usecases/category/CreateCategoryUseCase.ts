import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Category } from '../../entities/Category.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string;
    displayOrder?: number;
    isActive?: boolean;
}

export interface ICreateCategoryUseCase {
    execute(input: CreateCategoryInput): Promise<Result<Category>>;
}

@Service()
export class CreateCategoryUseCase implements ICreateCategoryUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(input: CreateCategoryInput): Promise<Result<Category>> {
        // 1. Generate slug
        const slug = input.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        // 2. Check overlap
        const existing = await this.categoryRepository.findBySlug(slug);
        if (existing) {
            return ResultHelper.failure('Category with this name already exists', ErrorCode.CONFLICT);
        }

        // 3. Create entity
        const category = new Category(
            uuidv4(),
            input.name,
            slug,
            input.description || null,
            input.parentId || null,
            input.displayOrder || 0,
            input.isActive ?? true
        );

        // 4. Save
        const created = await this.categoryRepository.create(category);
        return ResultHelper.success(created);
    }
}
