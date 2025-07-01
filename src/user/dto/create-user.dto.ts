import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { trimString } from 'src/common/utils/transformString';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => trimString(value))
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => trimString(value))
  email: string;

  @IsNotEmpty()
  @IsString()
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
