import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  normalizeEmail,
  trimString,
} from 'src/common/utils/transformString.util';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }) => trimString(value))
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => normalizeEmail(value))
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Transform(({ value }) => trimString(value))
  password: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  family?: string;

  @IsOptional()
  @IsString()
  coatOfArms?: string;
}
