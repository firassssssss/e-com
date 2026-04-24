import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Address } from '../../entities/Address.js';
import { IAddressRepository } from '../../repositories/IAddressRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface AddAddressInput {
    userId: string;
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    state?: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
}

export interface IAddAddressUseCase {
    execute(input: AddAddressInput): Promise<Result<Address>>;
}

@Service()
export class AddAddressUseCase implements IAddAddressUseCase {
    constructor(
        @Inject('IAddressRepository') private addressRepository: IAddressRepository
    ) { }

    async execute(input: AddAddressInput): Promise<Result<Address>> {
        // If making default, unset other defaults?
        if (input.isDefault) {
            const existingDefault = await this.addressRepository.findDefaultAddress(input.userId);
            if (existingDefault) {
                existingDefault.isDefault = false;
                await this.addressRepository.update(existingDefault);
            }
        } else {
            // If first address, make it default automatically?
            const addresses = await this.addressRepository.findByUserId(input.userId);
            if (addresses.length === 0) {
                input.isDefault = true;
            }
        }

        const address = new Address(
            uuidv4(),
            input.userId,
            input.fullName,
            input.phoneNumber,
            input.streetAddress,
            input.city,
            input.state || null,
            input.postalCode,
            input.country || 'Tunisia',
            input.isDefault || false
        );

        const created = await this.addressRepository.create(address);
        return ResultHelper.success(created);
    }
}
