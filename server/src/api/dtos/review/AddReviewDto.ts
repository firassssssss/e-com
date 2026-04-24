import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsArray, IsUrl } from 'class-validator';

export class AddReviewDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating!: number;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}
