import { IsOptional, IsString, IsUrl, IsBoolean } from 'class-validator';
export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUrl() image?: string;
  @IsOptional() @IsString() skinType?: string;
  @IsOptional() @IsString() hairType?: string;
  @IsOptional() @IsString() skinConcerns?: string;
  @IsOptional() @IsString() discoverySource?: string;
  @IsOptional() @IsBoolean() onboardingDone?: boolean;
}
