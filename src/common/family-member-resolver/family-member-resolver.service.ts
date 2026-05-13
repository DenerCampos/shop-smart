import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';
import { FAMILY_GROUP_ROLES } from 'src/family-group/types/family-group-role.type';
import { FAMILY_GROUP_MEMBER_STATUS } from 'src/family-group/types/family-group-member-status.type';
import { FamilyMemberResult } from './family-member-resolver.interface';

@Injectable()
export class FamilyMemberResolverService {
  constructor(
    @InjectRepository(FamilyGroupMember)
    private readonly memberEntity: Repository<FamilyGroupMember>,
  ) {}

  async resolve(userId: string): Promise<FamilyMemberResult> {
    const membership = await this.memberEntity
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.familyGroup', 'familyGroup')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getOne();

    if (!membership) {
      return { userIds: [userId], isAdmin: false, groupId: null, groupName: null };
    }

    if (membership.role !== FAMILY_GROUP_ROLES.ADMIN) {
      return {
        userIds: [userId],
        isAdmin: false,
        groupId: membership.familyGroup.id,
        groupName: membership.familyGroup.name,
      };
    }

    const acceptedMembers = await this.memberEntity
      .createQueryBuilder('member')
      .select('member.userId', 'userId')
      .where('member.familyGroupId = :groupId', {
        groupId: membership.familyGroup.id,
      })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('member.userId IS NOT NULL')
      .getRawMany();

    const userIds = acceptedMembers.map((m) => m.userId);

    return {
      userIds: userIds.length > 0 ? userIds : [userId],
      isAdmin: true,
      groupId: membership.familyGroup.id,
      groupName: membership.familyGroup.name,
    };
  }
}
