import { IsEmail, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/swagger';
import { trimString } from 'src/common/utils/transformString.util';
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => trimString(value))
  email?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  family?: string;

  @IsOptional()
  @IsString()
  coatOfArms?: string;
}
