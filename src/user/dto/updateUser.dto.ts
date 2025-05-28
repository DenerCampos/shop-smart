import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './createUser.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  family?: string;

  @IsOptional()
  @IsNumber()
  income?: number;

  @IsOptional()
  @IsNumber()
  expenses?: number;

  @IsOptional()
  @IsNumber()
  coins?: number;

  @IsOptional()
  @IsString()
  coatOfArms?: string;
}
