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
    const membership = await this.findAcceptedMembership(userId);

    if (!membership) {
      return { userIds: [userId], isAdmin: false, groupId: null };
    }

    const isAdmin = membership.role === FAMILY_GROUP_ROLES.ADMIN;
    const userIds = isAdmin
      ? await this.listAcceptedUserIds(membership.familyGroup.id, userId)
      : [userId];

    return {
      userIds,
      isAdmin,
      groupId: membership.familyGroup.id,
    };
  }

  async getAcceptedMemberUserIds(userId: string): Promise<string[]> {
    const membership = await this.findAcceptedMembership(userId);

    if (!membership) {
      return [userId];
    }

    return this.listAcceptedUserIds(membership.familyGroup.id, userId);
  }

  async getAcceptedMemberUserIdsIfAdmin(userId: string): Promise<string[]> {
    const membership = await this.findAcceptedMembership(userId);

    if (!membership || membership.role !== FAMILY_GROUP_ROLES.ADMIN) {
      return [userId];
    }

    return this.listAcceptedUserIds(membership.familyGroup.id, userId);
  }

  private async findAcceptedMembership(
    userId: string,
  ): Promise<FamilyGroupMember | null> {
    return this.memberEntity
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.familyGroup', 'familyGroup')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getOne();
  }

  private async listAcceptedUserIds(
    groupId: string,
    fallbackUserId: string,
  ): Promise<string[]> {
    const acceptedMembers = await this.memberEntity
      .createQueryBuilder('member')
      .select('member.userId', 'userId')
      .where('member.familyGroupId = :groupId', { groupId })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('member.userId IS NOT NULL')
      .getRawMany<{ userId: string }>();

    const userIds = acceptedMembers.map((member) => member.userId);

    return userIds.length > 0 ? userIds : [fallbackUserId];
  }
}
