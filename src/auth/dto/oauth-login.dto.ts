import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class OauthLoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  session_code: string;
}
