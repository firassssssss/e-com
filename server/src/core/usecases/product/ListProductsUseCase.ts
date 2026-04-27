import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Product } from '../../entities/Product.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';

export interface ListProductsInput {
  search?: string;
  categoryId?: string;
  skinType?: string;
}

export interface IListProductsUseCase {
  execute(input?: ListProductsInput): Promise<Result<Product[]>>;
}

@Service()
export class ListProductsUseCase implements IListProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private productRepository: IProductRepository
  ) {}

  async execute(input?: ListProductsInput): Promise<Result<Product[]>> {
    // Delegate filtering to the DB layer — avoids loading the full catalog
    // into Node.js memory for every product-list request.
    const results = input
      ? await this.productRepository.findFiltered(input)
      : await this.productRepository.findAll();

    return ResultHelper.success(results);
  }
}