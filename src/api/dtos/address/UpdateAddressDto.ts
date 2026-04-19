import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAddressDto {
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
    state?: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
