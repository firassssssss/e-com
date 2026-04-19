import { IsString, IsNotEmpty, IsNumber, Min, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsString()
    @IsNotEmpty()
    categoryId!: string;

    @IsString()
    @IsNotEmpty()
    brand!: string;

    @IsString()
    @IsNotEmpty()
    sku!: string;

    @IsNumber()
    @Min(0)
    stock!: number;

    @IsArray()
    @IsString({ each: true })
    images!: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    ingredients?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skinType?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
