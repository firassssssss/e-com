import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceTokenDTO {
  @IsNotEmpty()
  @IsString()
  token!: string;
}
