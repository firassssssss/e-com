import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';

export interface IDeleteCategoryUseCase {
    execute(id: string): Promise<Result<void>>;
}

@Service()
export class DeleteCategoryUseCase implements IDeleteCategoryUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(id: string): Promise<Result<void>> {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            return ResultHelper.failure('Category not found', ErrorCode.NOT_FOUND);
        }

        // Potentially check for products using this category first?
        // DB has cascade delete on children, but products might just have null category or foreign key error?
        // Products table has `references(() => categories.id)`. Default is usually NO ACTION or RESTRICT unless specified.
        // If strict, we should check. MVP: Delete and let DB handle or standard error.

        await this.categoryRepository.delete(id);
        return ResultHelper.success(undefined);
    }
}
