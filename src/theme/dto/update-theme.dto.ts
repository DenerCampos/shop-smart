import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateThemeDto } from './create-theme.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateThemeDto extends PartialType(CreateThemeDto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsString()
  theme: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  requiredCoins: number;

  @IsOptional()
  @IsString()
  background: string;
}
