import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  normalizeEmail,
  trimString,
} from 'src/common/utils/transformString.util';

export class SignInDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => normalizeEmail(value))
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => trimString(value))
  password: string;
}
