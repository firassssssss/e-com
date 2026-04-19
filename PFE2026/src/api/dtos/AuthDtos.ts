// Data Transfer Objects for Authentication-related operations
import { IsString, IsNotEmpty, Length, IsIn } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['register', 'login'])
  purpose!: 'register' | 'login';
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
