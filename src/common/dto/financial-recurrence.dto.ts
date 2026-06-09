import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type {
  InstallmentIntervalUnit,
  RecurrenceMode,
} from 'src/common/installment/installment.types';

export class RecurrenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsIn(['none', 'installment_finite', 'installment_infinite', 'fixed_repeat'])
  mode: RecurrenceMode;

  @ValidateIf((o) => o.mode === 'installment_finite')
  @IsInt()
  @Min(2)
  count?: number;

  @IsOptional()
  @IsIn(['days', 'months', 'years'])
  intervalUnit?: InstallmentIntervalUnit;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalValue?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  dueDay?: number;
}

export class FinancialRecurrenceBlockDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}
