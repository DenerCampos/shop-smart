import { Exclude, Expose, Type } from 'class-transformer';
import { FamilyGroupMemberResponseDto } from './family-group-member-response.dto';

class OwnerResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  profileImage: string | null;
}

export class FamilyGroupResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => OwnerResponseDto)
  owner: OwnerResponseDto;

  @Expose()
  @Type(() => FamilyGroupMemberResponseDto)
  members: FamilyGroupMemberResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
