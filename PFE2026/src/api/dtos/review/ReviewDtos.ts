import { IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, Min, Max } from 'class-validator';

/**
 * DTO for creating a new review
 */
export class CreateReviewDto {
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

    @IsString()
    @IsOptional()
    orderId?: string; // For verified purchase badge
}

/**
 * DTO for approving a review (admin only)
 */
export class ApproveReviewDto {
    @IsString()
    @IsNotEmpty()
    reviewId!: string;
}
