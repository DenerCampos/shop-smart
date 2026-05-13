import { Expose, Type } from 'class-transformer';

class MemberSummaryDto {
  @Expose()
  userId: string;

  @Expose()
  name: string;

  @Expose()
  profileImage: string | null;

  @Expose()
  totalExpenses: number;

  @Expose()
  totalRevenues: number;

  @Expose()
  masked: boolean;
}

export class FamilyGroupSummaryResponseDto {
  @Expose()
  groupId: string;

  @Expose()
  groupName: string;

  @Expose()
  totalExpenses: number;

  @Expose()
  totalRevenues: number;

  @Expose()
  balance: number;

  @Expose()
  @Type(() => MemberSummaryDto)
  members: MemberSummaryDto[];
}
