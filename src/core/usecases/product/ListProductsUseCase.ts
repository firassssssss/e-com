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
    let products = await this.productRepository.findAll();

    if (input?.categoryId) {
      products = products.filter(p => p.categoryId === input.categoryId);
    }
    if (input?.skinType) {
      products = products.filter(p =>
        p.skinType?.includes(input.skinType!) || p.skinType?.includes('all')
      );
    }
    if (input?.search) {
      const q = input.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }

    return ResultHelper.success(products);
  }
}