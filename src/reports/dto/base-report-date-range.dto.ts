import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';
import {
  addTimeIfMissing,
  getFirstDayOfMonth,
  getLastDayOfMonth,
} from 'src/common/utils/dates.util';

const UUID_OR_ALL_REGEX =
  /^(all|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export class BaseReportDateRangeDto {
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

  @IsOptional()
  @IsString()
  @Matches(UUID_OR_ALL_REGEX, {
    message: 'userId must be "all" or a valid UUID',
  })
  userId?: string;
}
