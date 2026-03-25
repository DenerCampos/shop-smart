import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

const UUID_OR_ALL_REGEX =
  /^(all|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export class ExpensesIncomeComparisonDto {
  @IsOptional()
  @IsString()
  @Matches(UUID_OR_ALL_REGEX, {
    message: 'userId must be "all" or a valid UUID',
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Year must be a 4-digit number' })
  @Transform(({ value }) => {
    if (!value) {
      return new Date().getFullYear().toString();
    }

    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(value)) {
      return new Date().getFullYear().toString();
    }

    const yearNum = parseInt(value);
    const currentYear = new Date().getFullYear();

    if (yearNum < 1900 || yearNum > currentYear + 10) {
      return currentYear.toString();
    }

    return value;
  })
  year?: string;
}
