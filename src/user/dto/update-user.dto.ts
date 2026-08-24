import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/swagger';
import {
  normalizeEmail,
  trimString,
} from 'src/common/utils/transformString.util';
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }) => trimString(value))
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => normalizeEmail(value))
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Transform(({ value }) => trimString(value))
  password?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  family?: string;

  @IsOptional()
  @IsString()
  coatOfArms?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
