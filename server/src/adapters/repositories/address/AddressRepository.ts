import { Service } from 'typedi';
import { IAddressRepository } from '../../../core/repositories/IAddressRepository.js';
import { Address } from '../../../core/entities/Address.js';
import { db } from '../../../infrastructure/db/index.js';
import { addresses } from '../../../infrastructure/db/schema/addresses.js';
import { eq, and } from 'drizzle-orm';
import { AddressMapper } from './mappers/AddressMapper.js';

@Service()
export class AddressRepository implements IAddressRepository {
    async findById(id: string): Promise<Address | null> {
        const result = await db.select().from(addresses).where(eq(addresses.id, id));
        return result[0] ? AddressMapper.toDomain(result[0]) : null;
    }

    async findByUserId(userId: string): Promise<Address[]> {
        const result = await db.select().from(addresses).where(eq(addresses.userId, userId));
        return result.map(AddressMapper.toDomain);
    }

    async findDefaultAddress(userId: string): Promise<Address | null> {
        const result = await db
            .select()
            .from(addresses)
            .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
        return result[0] ? AddressMapper.toDomain(result[0]) : null;
    }

    async create(address: Address): Promise<Address> {
        const dbAddress = AddressMapper.toPersistence(address);
        const result = await db.insert(addresses).values(dbAddress).returning();
        return AddressMapper.toDomain(result[0]);
    }

    async update(address: Address): Promise<Address> {
        const dbAddress = AddressMapper.toPersistence(address);
        const result = await db
            .update(addresses)
            .set(dbAddress)
            .where(eq(addresses.id, address.id))
            .returning();
        return AddressMapper.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await db.delete(addresses).where(eq(addresses.id, id));
    }
}
