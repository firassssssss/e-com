import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Category } from '../../entities/Category.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';

export interface IGetCategoryUseCase {
    execute(id: string): Promise<Result<Category>>;
}

@Service()
export class GetCategoryUseCase implements IGetCategoryUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(id: string): Promise<Result<Category>> {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            return ResultHelper.failure('Category not found', ErrorCode.NOT_FOUND);
        }
        return ResultHelper.success(category);
    }
}
