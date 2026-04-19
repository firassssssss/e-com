import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    parentId?: string;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
