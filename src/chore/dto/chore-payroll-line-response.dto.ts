import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';

@Exclude()
export class ChorePayrollPendingMemberDto {
  @Expose()
  totalPending: number;

  @Expose()
  @Type(() => OwnerResponseDto)
  member: OwnerResponseDto;
}

@Exclude()
export class ChorePayrollPendingResponseDto {
  @Expose()
  periodYm: number;

  @Expose()
  @Type(() => ChorePayrollPendingMemberDto)
  members: ChorePayrollPendingMemberDto[];
}
