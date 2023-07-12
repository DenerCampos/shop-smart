import { IsEmail, IsOptional } from 'class-validator';
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
}
