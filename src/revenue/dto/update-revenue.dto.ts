import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateRevenueDto } from './create-revenue.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateRevenueDto extends PartialType(CreateRevenueDto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsBoolean()
  repeat: boolean;
}
