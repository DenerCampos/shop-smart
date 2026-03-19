import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMember } from '../entities/family-group-member.entity';
import { IFamilyGroupRepository } from '../interfaces/family-group.repository.interface';
import { User } from 'src/user/entities/user.entity';
import { FamilyGroupRole } from '../types/family-group-role.type';
import { FamilyGroupMemberStatus } from '../types/family-group-member-status.type';

@Injectable()
export class FamilyGroupRepository implements IFamilyGroupRepository {
  constructor(
    @InjectRepository(FamilyGroup)
    private readonly familyGroupEntity: Repository<FamilyGroup>,
    @InjectRepository(FamilyGroupMember)
    private readonly memberEntity: Repository<FamilyGroupMember>,
  ) {}

  async createGroup(name: string, owner: User): Promise<FamilyGroup> {
    const group = this.familyGroupEntity.create({ name, owner });
    return await this.familyGroupEntity.save(group);
  }

  async findGroupById(id: string): Promise<FamilyGroup | null> {
    return await this.familyGroupEntity.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user', 'members.invitedBy'],
    });
  }

  async findGroupsByUserId(userId: string): Promise<FamilyGroup[]> {
    return await this.familyGroupEntity
      .createQueryBuilder('fg')
      .innerJoin('fg.members', 'member')
      .leftJoinAndSelect('fg.owner', 'owner')
      .leftJoinAndSelect('fg.members', 'allMembers')
      .leftJoinAndSelect('allMembers.user', 'memberUser')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', { status: 'accepted' })
      .getMany();
  }

  async findGroupsByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<[FamilyGroup[], number]> {
    const queryBuilder = this.familyGroupEntity
      .createQueryBuilder('fg')
      .innerJoin('fg.members', 'member')
      .leftJoinAndSelect('fg.owner', 'owner')
      .leftJoinAndSelect('fg.members', 'allMembers')
      .leftJoinAndSelect('allMembers.user', 'memberUser')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', { status: 'accepted' })
      .orderBy('fg.createdAt', 'DESC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    return await queryBuilder.getManyAndCount();
  }

  async updateGroup(group: FamilyGroup, name: string): Promise<FamilyGroup> {
    return await this.familyGroupEntity.save({ ...group, name });
  }

  async deleteGroup(id: string): Promise<boolean> {
    await this.memberEntity.softDelete({ familyGroup: { id } });
    const result = await this.familyGroupEntity.softDelete({ id });
    return result.affected === 1;
  }

  async createMember(
    familyGroup: FamilyGroup,
    user: User | null,
    invitedEmail: string,
    role: FamilyGroupRole,
    status: FamilyGroupMemberStatus,
    invitedBy: User,
  ): Promise<FamilyGroupMember> {
    const member = this.memberEntity.create({
      familyGroup,
      user,
      invitedEmail,
      role,
      status,
      invitedBy,
      joinedAt: status === 'accepted' ? new Date() : null,
    });
    return await this.memberEntity.save(member);
  }

  async findMemberById(id: string): Promise<FamilyGroupMember | null> {
    return await this.memberEntity.findOne({
      where: { id },
      relations: ['familyGroup', 'familyGroup.owner', 'user', 'invitedBy'],
    });
  }

  async findMembersByGroupId(groupId: string): Promise<FamilyGroupMember[]> {
    return await this.memberEntity.find({
      where: { familyGroup: { id: groupId } },
      relations: ['user', 'invitedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findMemberByGroupAndUser(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember | null> {
    return await this.memberEntity.findOne({
      where: {
        familyGroup: { id: groupId },
        user: { id: userId },
      },
      relations: ['familyGroup', 'familyGroup.owner', 'user'],
    });
  }

  async findMemberByGroupAndEmail(
    groupId: string,
    email: string,
  ): Promise<FamilyGroupMember | null> {
    return await this.memberEntity.findOne({
      where: {
        familyGroup: { id: groupId },
        invitedEmail: email,
      },
      relations: ['user'],
    });
  }

  async findPendingInvitationsByUserId(
    userId: string,
  ): Promise<FamilyGroupMember[]> {
    return await this.memberEntity.find({
      where: {
        user: { id: userId },
        status: 'pending',
      },
      relations: ['familyGroup', 'familyGroup.owner', 'invitedBy'],
    });
  }

  async findPendingInvitationsByEmail(
    email: string,
  ): Promise<FamilyGroupMember[]> {
    return await this.memberEntity.find({
      where: {
        invitedEmail: email,
        status: 'pending',
      },
      relations: ['familyGroup', 'familyGroup.owner', 'invitedBy'],
    });
  }

  async findAcceptedMembershipByUserId(
    userId: string,
  ): Promise<FamilyGroupMember | null> {
    return await this.memberEntity
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.familyGroup', 'familyGroup')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', { status: 'accepted' })
      .andWhere('member.deletedAt IS NULL')
      .andWhere('familyGroup.deletedAt IS NULL')
      .getOne();
  }

  async updateMemberRole(
    member: FamilyGroupMember,
    role: FamilyGroupRole,
  ): Promise<FamilyGroupMember> {
    return await this.memberEntity.save({ ...member, role });
  }

  async updateMemberStatus(
    member: FamilyGroupMember,
    status: FamilyGroupMemberStatus,
    joinedAt?: Date,
  ): Promise<FamilyGroupMember> {
    const updates: Partial<FamilyGroupMember> = { ...member, status };
    if (joinedAt) {
      updates.joinedAt = joinedAt;
    }
    return await this.memberEntity.save(updates);
  }

  async linkUserToMember(
    member: FamilyGroupMember,
    user: User,
  ): Promise<FamilyGroupMember> {
    return await this.memberEntity.save({ ...member, user });
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await this.memberEntity.softDelete({ id });
    return result.affected === 1;
  }
}
