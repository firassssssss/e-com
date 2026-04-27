import {
  IsString, IsNumber, Min, Max, IsArray,
  IsOptional, IsBoolean, MaxLength, ArrayMaxSize,
} from 'class-validator';

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100000)
    price?: number | null;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    sku?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000000)
    stock?: number | null;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    ingredients?: string[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    skinType?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
