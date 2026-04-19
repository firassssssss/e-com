import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

/**
 * All 24 Tunisian governorates
 */
export const TUNISIAN_GOVERNORATES = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
    'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
    'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
    'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
] as const;

/**
 * DTO for creating a new address
 */
export class CreateAddressDto {
    @IsString()
    @IsOptional()
    label?: string; // "Home", "Work", etc.

    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber!: string;

    @IsString()
    @IsNotEmpty()
    streetAddress!: string;

    @IsString()
    @IsNotEmpty()
    city!: string; // Delegation/Municipality

    @IsString()
    @IsNotEmpty()
    @IsIn(TUNISIAN_GOVERNORATES)
    governorate!: string;

    @IsString()
    @IsNotEmpty()
    postalCode!: string;

    @IsString()
    @IsOptional()
    additionalInfo?: string; // Apartment, floor, building

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

/**
 * DTO for updating an address
 */
export class UpdateAddressDto {
    @IsString()
    @IsOptional()
    label?: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    streetAddress?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    @IsIn(TUNISIAN_GOVERNORATES)
    governorate?: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    additionalInfo?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
