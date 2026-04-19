import { Address } from '../../../../core/entities/Address.js';
import { addresses } from '../../../../infrastructure/db/schema/addresses.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbAddress = InferSelectModel<typeof addresses>;
type NewDbAddress = InferInsertModel<typeof addresses>;

export class AddressMapper {
    static toDomain(dbAddress: DbAddress): Address {
        return new Address(
            dbAddress.id,
            dbAddress.userId,
            dbAddress.fullName,
            dbAddress.phoneNumber,
            dbAddress.streetAddress,
            dbAddress.city,
            dbAddress.state,
            dbAddress.postalCode,
            dbAddress.country,
            dbAddress.isDefault,
            dbAddress.createdAt,
            dbAddress.updatedAt
        );
    }

    static toPersistence(address: Address): NewDbAddress {
        return {
            id: address.id,
            userId: address.userId,
            fullName: address.fullName,
            phoneNumber: address.phoneNumber,
            streetAddress: address.streetAddress,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt,
        };
    }
}
