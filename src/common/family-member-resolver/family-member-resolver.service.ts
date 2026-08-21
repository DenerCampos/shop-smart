import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';
import { FAMILY_GROUP_ROLES } from 'src/family-group/types/family-group-role.type';
import { FAMILY_GROUP_MEMBER_STATUS } from 'src/family-group/types/family-group-member-status.type';
import { FamilyMemberResult } from './family-member-resolver.interface';
import {
  pickPrimaryFamilyGroup,
  sortFamilyGroupsByPriority,
  FamilyGroupPriorityInput,
} from 'src/family-group/utils/family-group-priority';

type AcceptedMembershipRow = {
  groupId: string;
  groupName: string;
  ownerId: string;
  role: 'admin' | 'member';
  joinedAt: Date | null;
};

@Injectable()
export class FamilyMemberResolverService {
  constructor(
    @InjectRepository(FamilyGroupMember)
    private readonly memberEntity: Repository<FamilyGroupMember>,
  ) {}

  /**
   * Sem familyGroupId: retorna apenas o próprio user (sem promover visão familiar).
   * Com familyGroupId: exige membership accepted; senão 403.
   */
  async resolve(
    userId: string,
    familyGroupId?: string | null,
  ): Promise<FamilyMemberResult> {
    if (!familyGroupId) {
      return { userIds: [userId], isAdmin: false, groupId: null };
    }

    const membership = await this.requireAcceptedMembership(
      userId,
      familyGroupId,
    );

    const isAdmin = membership.role === FAMILY_GROUP_ROLES.ADMIN;
    const userIds = isAdmin
      ? await this.listAcceptedUserIds(familyGroupId, userId)
      : [userId];

    return {
      userIds,
      isAdmin,
      groupId: familyGroupId,
    };
  }

  async getAcceptedMemberUserIds(
    userId: string,
    familyGroupId?: string | null,
  ): Promise<string[]> {
    if (!familyGroupId) {
      return [userId];
    }

    await this.requireAcceptedMembership(userId, familyGroupId);

    return this.listAcceptedUserIds(familyGroupId, userId);
  }

  async getAcceptedMemberUserIdsIfAdmin(
    userId: string,
    familyGroupId?: string | null,
  ): Promise<string[]> {
    if (!familyGroupId) {
      return [userId];
    }

    const membership = await this.requireAcceptedMembership(
      userId,
      familyGroupId,
    );

    if (membership.role !== FAMILY_GROUP_ROLES.ADMIN) {
      return [userId];
    }

    return this.listAcceptedUserIds(familyGroupId, userId);
  }

  async listAcceptedMemberships(
    userId: string,
  ): Promise<AcceptedMembershipRow[]> {
    const rows = await this.memberEntity
      .createQueryBuilder('member')
      .innerJoin('member.familyGroup', 'familyGroup')
      .innerJoin('familyGroup.owner', 'owner')
      .select('familyGroup.id', 'groupId')
      .addSelect('familyGroup.name', 'groupName')
      .addSelect('owner.id', 'ownerId')
      .addSelect('member.role', 'role')
      .addSelect('member.joinedAt', 'joinedAt')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getRawMany<{
        groupId: string;
        groupName: string;
        ownerId: string;
        role: 'admin' | 'member';
        joinedAt: Date | null;
      }>();

    return rows;
  }

  async getPrimaryFamilyGroupId(userId: string): Promise<string | null> {
    const primary = await this.getPrimaryMembership(userId);
    return primary?.groupId ?? null;
  }

  async getPrimaryFamilyDisplayName(
    userId: string,
    fallback: string,
  ): Promise<string> {
    const primary = await this.getPrimaryMembership(userId);
    return primary?.groupName || fallback || '';
  }

  async isAdminOfAnyGroup(userId: string): Promise<boolean> {
    const count = await this.memberEntity
      .createQueryBuilder('member')
      .innerJoin('member.familyGroup', 'familyGroup')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.role = :role', { role: FAMILY_GROUP_ROLES.ADMIN })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getCount();

    return count > 0;
  }

  async isOwnerOfAnyActiveGroup(userId: string): Promise<boolean> {
    const count = await this.memberEntity
      .createQueryBuilder('member')
      .innerJoin('member.familyGroup', 'familyGroup')
      .where('familyGroup.ownerId = :userId', { userId })
      .andWhere('familyGroup.deletedAt IS NULL')
      .getCount();

    return count > 0;
  }

  async isSoleAcceptedAdminOfAnyGroup(userId: string): Promise<boolean> {
    const row = await this.memberEntity
      .createQueryBuilder('member')
      .innerJoin('member.familyGroup', 'familyGroup')
      .select('member.id', 'id')
      .where('member.userId = :userId', { userId })
      .andWhere('member.role = :role', { role: FAMILY_GROUP_ROLES.ADMIN })
      .andWhere('member.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(other.id)')
          .from(FamilyGroupMember, 'other')
          .where('other.familyGroupId = familyGroup.id')
          .andWhere('other.role = :role')
          .andWhere('other.status = :status')
          .andWhere('other.deletedAt IS NULL')
          .getQuery();

        return `${subQuery} = 1`;
      })
      .getRawOne();

    return Boolean(row);
  }

  async softDeleteMembershipsForUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager?.getRepository(FamilyGroupMember) ?? this.memberEntity;

    await repo
      .createQueryBuilder()
      .softDelete()
      .where('userId = :userId', { userId })
      .andWhere('deletedAt IS NULL')
      .execute();
  }

  /** Grupo em que o ator é admin e o alvo é membro accepted (primeiro por prioridade). */
  async findAdminGroupForTarget(
    adminUserId: string,
    targetUserId: string,
  ): Promise<string | null> {
    if (adminUserId === targetUserId) {
      return this.getPrimaryFamilyGroupId(adminUserId);
    }

    const rows = await this.memberEntity
      .createQueryBuilder('adminMember')
      .innerJoin('adminMember.familyGroup', 'familyGroup')
      .innerJoin('familyGroup.owner', 'owner')
      .innerJoin(
        'familyGroup.members',
        'targetMember',
        'targetMember.userId = :targetUserId AND targetMember.status = :status AND targetMember.deletedAt IS NULL',
        {
          targetUserId,
          status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        },
      )
      .select('familyGroup.id', 'groupId')
      .addSelect('familyGroup.name', 'groupName')
      .addSelect('owner.id', 'ownerId')
      .addSelect('adminMember.role', 'role')
      .addSelect('adminMember.joinedAt', 'joinedAt')
      .where('adminMember.userId = :adminUserId', { adminUserId })
      .andWhere('adminMember.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('adminMember.role = :role', { role: FAMILY_GROUP_ROLES.ADMIN })
      .andWhere('adminMember.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getRawMany<{
        groupId: string;
        groupName: string;
        ownerId: string;
        role: 'admin' | 'member';
        joinedAt: Date | null;
      }>();

    const inputs: FamilyGroupPriorityInput[] = rows.map((r) => ({
      id: r.groupId,
      name: r.groupName,
      ownerId: r.ownerId,
      viewerRole: r.role,
      joinedAt: r.joinedAt,
    }));

    const primary = pickPrimaryFamilyGroup(inputs, adminUserId);
    return primary?.id ?? null;
  }

  /** True se compartilham ao menos um grupo accepted. */
  async shareAnyAcceptedGroup(
    userIdA: string,
    userIdB: string,
  ): Promise<boolean> {
    if (userIdA === userIdB) return true;

    const count = await this.memberEntity
      .createQueryBuilder('a')
      .innerJoin(
        'a.familyGroup',
        'familyGroup',
        'familyGroup.deletedAt IS NULL',
      )
      .innerJoin(
        'familyGroup.members',
        'b',
        'b.userId = :userIdB AND b.status = :status AND b.deletedAt IS NULL',
        {
          userIdB,
          status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        },
      )
      .where('a.userId = :userIdA', { userIdA })
      .andWhere('a.status = :status', {
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      })
      .andWhere('a.deletedAt IS NULL')
      .getCount();

    return count > 0;
  }

  async isAdminManagingTarget(
    adminUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    if (adminUserId === targetUserId) return true;
    const groupId = await this.findAdminGroupForTarget(
      adminUserId,
      targetUserId,
    );
    return groupId !== null;
  }

  /** União de membros accepted de todos os grupos do usuário. */
  async getAllAcceptedMemberUserIdsAcrossGroups(
    userId: string,
  ): Promise<string[]> {
    const memberships = await this.listAcceptedMemberships(userId);
    const idSet = new Set<string>([userId]);
    for (const g of memberships) {
      const ids = await this.listAcceptedUserIds(g.groupId, userId);
      ids.forEach((id) => idSet.add(id));
    }
    return [...idSet];
  }

  /** Todos os userIds dos grupos em que o user é admin (união). */
  async getAllAdminManagedUserIds(userId: string): Promise<string[]> {
    const memberships = await this.listAcceptedMemberships(userId);
    const adminGroups = memberships.filter(
      (m) => m.role === FAMILY_GROUP_ROLES.ADMIN,
    );

    if (adminGroups.length === 0) {
      return [userId];
    }

    const idSet = new Set<string>([userId]);
    for (const g of adminGroups) {
      const ids = await this.listAcceptedUserIds(g.groupId, userId);
      ids.forEach((id) => idSet.add(id));
    }
    return [...idSet];
  }

  private async getPrimaryMembership(
    userId: string,
  ): Promise<AcceptedMembershipRow | null> {
    const rows = await this.listAcceptedMemberships(userId);
    if (rows.length === 0) return null;

    const inputs = rows.map((r) => ({
      id: r.groupId,
      name: r.groupName,
      ownerId: r.ownerId,
      viewerRole: r.role,
      joinedAt: r.joinedAt,
      _row: r,
    }));

    const sorted = sortFamilyGroupsByPriority(inputs, userId);
    return sorted[0]?._row ?? null;
  }

  private async requireAcceptedMembership(
    userId: string,
    familyGroupId: string,
  ): Promise<FamilyGroupMember> {
    const membership = await this.findAcceptedMembershipInGroup(
      userId,
      familyGroupId,
    );

    if (!membership) {
      throw new ForbiddenException(
        'Você não pertence a este grupo familiar ou o grupo é inválido.',
      );
    }

    return membership;
  }

  private async findAcceptedMembershipInGroup(
    userId: string,
    familyGroupId: string,
  ): Promise<FamilyGroupMember | null> {
    return this.memberEntity
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.familyGroup', 'familyGroup')
      .where('member.userId = :userId', { userId })
      .andWhere('member.familyGroupId = :familyGroupId', { familyGroupId })
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
