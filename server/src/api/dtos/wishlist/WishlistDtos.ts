import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for adding product to wishlist
 */
export class AddToWishlistDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsString()
    @IsOptional()
    variantId?: string;
}

/**
 * DTO for removing from wishlist
 */
export class RemoveFromWishlistDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsString()
    @IsOptional()
    variantId?: string;
}
