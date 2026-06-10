import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { RecurrenceResponseDto } from 'src/common/dto/financial-recurrence-response.dto';

export class RevenueResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  installmentGroupId: string | null;

  @Expose()
  installmentNumber: number | null;

  @Expose()
  totalInstallments: number | null;

  @Expose()
  isInstallment: boolean;

  @Expose()
  installmentLabel: string | null;

  @Expose()
  photos: string[];

  @Expose()
  @Type(() => RecurrenceResponseDto)
  recurrence: RecurrenceResponseDto;

  @Expose()
  date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => OwnerResponseDto)
  user: OwnerResponseDto;
}
