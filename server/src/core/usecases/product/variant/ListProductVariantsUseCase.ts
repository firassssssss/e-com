import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../../common/Result.js';
import { ProductVariant } from '../../../entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';

export interface IListProductVariantsUseCase {
    execute(productId: string): Promise<Result<ProductVariant[]>>;
}

@Service()
export class ListProductVariantsUseCase implements IListProductVariantsUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository
    ) { }

    async execute(productId: string): Promise<Result<ProductVariant[]>> {
        const variants = await this.variantRepository.findByProductId(productId);
        return ResultHelper.success(variants);
    }
}
