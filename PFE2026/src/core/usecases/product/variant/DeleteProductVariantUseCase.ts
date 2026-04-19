import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../../common/Result.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';

export interface IDeleteProductVariantUseCase {
    execute(id: string): Promise<Result<void>>;
}

@Service()
export class DeleteProductVariantUseCase implements IDeleteProductVariantUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository
    ) { }

    async execute(id: string): Promise<Result<void>> {
        const variant = await this.variantRepository.findById(id);
        if (!variant) {
            return ResultHelper.failure('Variant not found', ErrorCode.NOT_FOUND);
        }

        await this.variantRepository.delete(id);
        return ResultHelper.success(undefined);
    }
}
