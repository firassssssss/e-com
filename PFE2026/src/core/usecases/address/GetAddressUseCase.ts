import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Address } from '../../entities/Address.js';
import { IAddressRepository } from '../../repositories/IAddressRepository.js';

export interface IGetAddressUseCase {
    execute(id: string): Promise<Result<Address>>;
}

@Service()
export class GetAddressUseCase implements IGetAddressUseCase {
    constructor(
        @Inject('IAddressRepository') private addressRepository: IAddressRepository
    ) { }

    async execute(id: string): Promise<Result<Address>> {
        const address = await this.addressRepository.findById(id);
        if (!address) {
            return ResultHelper.failure('Address not found', ErrorCode.NOT_FOUND);
        }
        return ResultHelper.success(address);
    }
}
