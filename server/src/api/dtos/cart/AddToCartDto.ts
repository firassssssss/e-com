import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class AddToCartDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsNumber()
    @Min(1)
    @Max(100, { message: 'Cannot add more than 100 items at once' })
    quantity!: number;

    @IsOptional()
    @IsString()
    variantId?: string;
}
