import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { CreateRevenueDto } from './create-revenue.dto';

export class RevenueRecurringConfirmDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRevenueDto)
  revenues: CreateRevenueDto[];

  @IsArray()
  @ArrayNotEmpty()
  revenueIds: string[];
}
