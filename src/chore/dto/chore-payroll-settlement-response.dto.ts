import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';

@Exclude()
export class ChorePayrollSettlementLineDto {
  @Expose()
  totalAmount: number;

  @Expose()
  @Type(() => OwnerResponseDto)
  member: OwnerResponseDto;
}

@Exclude()
export class ChorePayrollSettlementDetailDto {
  @Expose()
  id: string;

  @Expose()
  periodYm: number;

  @Expose()
  settledAt: Date;

  @Expose()
  @Type(() => OwnerResponseDto)
  settledBy: OwnerResponseDto;

  @Expose()
  @Type(() => ChorePayrollSettlementLineDto)
  members: ChorePayrollSettlementLineDto[];

  @Expose()
  totalSettled: number;
}
