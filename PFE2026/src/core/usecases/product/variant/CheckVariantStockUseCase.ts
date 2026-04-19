import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../../common/Result.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';

export interface CheckVariantStockInput {
    id: string;
    quantity: number;
}

export interface ICheckVariantStockUseCase {
    execute(input: CheckVariantStockInput): Promise<Result<boolean>>;
}

@Service()
export class CheckVariantStockUseCase implements ICheckVariantStockUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository
    ) { }

    async execute(input: CheckVariantStockInput): Promise<Result<boolean>> {
        const variant = await this.variantRepository.findById(input.id);
        if (!variant) {
            return ResultHelper.failure('Variant not found', ErrorCode.NOT_FOUND);
        }

        if (!variant.isActive) {
            return ResultHelper.failure('Variant is not active', ErrorCode.VALIDATION_ERROR);
        }

        if (variant.stock < input.quantity) {
            return ResultHelper.failure('Insufficient stock', ErrorCode.VALIDATION_ERROR);
        }

        return ResultHelper.success(true);
    }
}
