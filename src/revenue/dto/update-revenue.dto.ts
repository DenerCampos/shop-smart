import { IsBoolean, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { CreateRevenueDto } from './create-revenue.dto';
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class UpdateRevenueDto extends PartialType(CreateRevenueDto) {
  @IsOptional()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsBoolean()
  repeat: boolean;

  @IsOptional()
  @IsDateString()
  date: Date;
}
