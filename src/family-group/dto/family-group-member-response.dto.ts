import { Exclude, Expose, Type } from 'class-transformer';
import { FamilyGroupRole } from '../types/family-group-role.type';
import { FamilyGroupMemberStatus } from '../types/family-group-member-status.type';

class MemberUserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  profileImage: string | null;
}

class MemberInvitedByResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class FamilyGroupMemberResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => MemberUserResponseDto)
  user: MemberUserResponseDto;

  @Expose()
  invitedEmail: string;

  @Expose()
  role: FamilyGroupRole;

  @Expose()
  status: FamilyGroupMemberStatus;

  @Expose()
  @Type(() => MemberInvitedByResponseDto)
  invitedBy: MemberInvitedByResponseDto;

  @Expose()
  joinedAt: Date;

  @Expose()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
