import { Expose } from 'class-transformer';
import type {
  InstallmentIntervalUnit,
  RecurrenceMode,
} from 'src/common/installment/installment.types';

export class RecurrenceResponseDto {
  @Expose()
  enabled: boolean;

  @Expose()
  mode: RecurrenceMode;

  @Expose()
  count?: number;

  @Expose()
  intervalUnit: InstallmentIntervalUnit;

  @Expose()
  intervalValue: number;

  @Expose()
  dueDay?: number;
}
