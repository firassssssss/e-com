import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Product } from '../../entities/Product.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';

export interface GetProductInput {
    id: string;
}

export interface IGetProductUseCase {
    execute(input: GetProductInput): Promise<Result<Product>>;
}

@Service()
export class GetProductUseCase implements IGetProductUseCase {
    constructor(
        @Inject('IProductRepository')
        private productRepository: IProductRepository
    ) { }

    async execute(input: GetProductInput): Promise<Result<Product>> {
        const product = await this.productRepository.findById(input.id);
        if (!product) {
            return ResultHelper.failure('Product not found', ErrorCode.NOT_FOUND);
        }
        return ResultHelper.success(product);
    }
}
