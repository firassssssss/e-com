import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Category } from '../../entities/Category.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';

export interface IListCategoriesUseCase {
    execute(): Promise<Result<Category[]>>;
}

@Service()
export class ListCategoriesUseCase implements IListCategoriesUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(): Promise<Result<Category[]>> {
        const categories = await this.categoryRepository.findAll();
        return ResultHelper.success(categories);
    }
}
