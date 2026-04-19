import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';
import { Address } from '../../entities/Address.js';
import { IAddressRepository } from '../../repositories/IAddressRepository.js';

export interface UpdateAddressInput {
    id: string;
    userId: string;
    fullName?: string;
    phoneNumber?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
}

export interface IUpdateAddressUseCase {
    execute(input: UpdateAddressInput): Promise<Result<Address>>;
}

@Service()
export class UpdateAddressUseCase implements IUpdateAddressUseCase {
    constructor(
        @Inject('IAddressRepository') private addressRepository: IAddressRepository
    ) { }

    async execute(input: UpdateAddressInput): Promise<Result<Address>> {
        const address = await this.addressRepository.findById(input.id);
        if (!address) {
            return ResultHelper.failure('Address not found', ErrorCode.NOT_FOUND);
        }

        if (address.userId !== input.userId) {
            return ResultHelper.failure('Unauthorized', ErrorCode.FORBIDDEN);
        }

        if (input.isDefault && !address.isDefault) {
            const existingDefault = await this.addressRepository.findDefaultAddress(input.userId);
            if (existingDefault) {
                existingDefault.isDefault = false;
                await this.addressRepository.update(existingDefault);
            }
        }

        if (input.fullName !== undefined) address.fullName = input.fullName;
        if (input.phoneNumber !== undefined) address.phoneNumber = input.phoneNumber;
        if (input.streetAddress !== undefined) address.streetAddress = input.streetAddress;
        if (input.city !== undefined) address.city = input.city;
        if (input.state !== undefined) address.state = input.state || null;
        if (input.postalCode !== undefined) address.postalCode = input.postalCode;
        if (input.country !== undefined) address.country = input.country;
        if (input.isDefault !== undefined) address.isDefault = input.isDefault;

        address.updatedAt = new Date();

        const updated = await this.addressRepository.update(address);
        return ResultHelper.success(updated);
    }
}
