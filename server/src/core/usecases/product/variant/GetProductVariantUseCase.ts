import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../../common/Result.js';
import { ProductVariant } from '../../../entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';

export interface IGetProductVariantUseCase {
    execute(id: string): Promise<Result<ProductVariant>>;
}

@Service()
export class GetProductVariantUseCase implements IGetProductVariantUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository
    ) { }

    async execute(id: string): Promise<Result<ProductVariant>> {
        const variant = await this.variantRepository.findById(id);
        if (!variant) {
            return ResultHelper.failure('Variant not found', ErrorCode.NOT_FOUND);
        }
        return ResultHelper.success(variant);
    }
}
