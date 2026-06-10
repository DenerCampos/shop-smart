import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';

/** Listagem e endpoints agregados — sem bloco `recurrence` (só no detalhe/edit). */
export class RevenueSummaryResponseDto {
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
