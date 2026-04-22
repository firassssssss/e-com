import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

/**
 * DTO for updating product variant stock
 */
export class UpdateVariantStockDto {
    @IsString()
    @IsNotEmpty()
    variantId!: string;

    @IsNumber()
    @Min(0)
    stock!: number;
}
