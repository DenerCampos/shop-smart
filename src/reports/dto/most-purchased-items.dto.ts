import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import {
  addTimeIfMissing,
  getFirstDayOfMonth,
  getLastDayOfMonth,
} from 'src/common/utils/dates.util';

export class MostPurchasedItemsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return getFirstDayOfMonth();
    return addTimeIfMissing(value, false);
  })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return getLastDayOfMonth();
    return addTimeIfMissing(value, true);
  })
  endDate?: string;
}
