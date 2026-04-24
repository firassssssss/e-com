import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { IAddressRepository } from '../../repositories/IAddressRepository.js';

export interface IDeleteAddressUseCase {
    execute(id: string, userId: string): Promise<Result<void>>;
}

@Service()
export class DeleteAddressUseCase implements IDeleteAddressUseCase {
    constructor(
        @Inject('IAddressRepository') private addressRepository: IAddressRepository
    ) { }

    async execute(id: string, userId: string): Promise<Result<void>> {
        const address = await this.addressRepository.findById(id);
        if (!address) {
            return ResultHelper.failure('Address not found', ErrorCode.NOT_FOUND);
        }

        if (address.userId !== userId) {
            return ResultHelper.failure('Unauthorized', ErrorCode.FORBIDDEN);
        }

        await this.addressRepository.delete(id);
        return ResultHelper.success(undefined);
    }
}
