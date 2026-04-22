import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsString()
    @IsNotEmpty()
    sku!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsObject()
    @IsNotEmpty()
    attributes!: Record<string, any>;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsNumber()
    @Min(0)
    stock!: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    compareAtPrice?: number;

    @IsNumber()
    @IsOptional()
    lowStockThreshold?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
