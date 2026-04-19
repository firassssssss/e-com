import { Address } from '../entities/Address.js';

export interface IAddressRepository {
    findById(id: string): Promise<Address | null>;
    findByUserId(userId: string): Promise<Address[]>;
    findDefaultAddress(userId: string): Promise<Address | null>;
    create(address: Address): Promise<Address>;
    update(address: Address): Promise<Address>;
    delete(id: string): Promise<void>;
}
