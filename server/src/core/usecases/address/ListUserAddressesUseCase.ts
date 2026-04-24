import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Address } from '../../entities/Address.js';
import { IAddressRepository } from '../../repositories/IAddressRepository.js';

export interface IListUserAddressesUseCase {
    execute(userId: string): Promise<Result<Address[]>>;
}

@Service()
export class ListUserAddressesUseCase implements IListUserAddressesUseCase {
    constructor(
        @Inject('IAddressRepository') private addressRepository: IAddressRepository
    ) { }

    async execute(userId: string): Promise<Result<Address[]>> {
        const addresses = await this.addressRepository.findByUserId(userId);
        return ResultHelper.success(addresses);
    }
}
