import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';
import { IHealthMemberRepository } from '../interfaces/health-member.repository.interface';
import { FAMILY_GROUP_MEMBER_STATUS } from 'src/family-group/types/family-group-member-status.type';

@Injectable()
export class HealthMemberRepository implements IHealthMemberRepository {
  constructor(
    @InjectRepository(FamilyGroupMember)
    private readonly entity: Repository<FamilyGroupMember>,
  ) {}

  private repo(manager?: EntityManager): Repository<FamilyGroupMember> {
    return manager ? manager.getRepository(FamilyGroupMember) : this.entity;
  }

  async findMembership(
    userId: string,
    manager?: EntityManager,
  ): Promise<FamilyGroupMember | null> {
    return this.repo(manager).findOne({
      where: {
        user: { id: userId } as any,
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        deletedAt: null as any,
      },
    });
  }

  async findMembershipWithGroup(
    userId: string,
    manager?: EntityManager,
  ): Promise<FamilyGroupMember | null> {
    return this.repo(manager).findOne({
      where: {
        user: { id: userId } as any,
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        deletedAt: null as any,
      },
      relations: ['familyGroup'],
    });
  }

  async isMemberOfGroup(
    userId: string,
    groupId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const found = await this.repo(manager).findOne({
      where: {
        familyGroup: { id: groupId } as any,
        user: { id: userId } as any,
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        deletedAt: null as any,
      },
    });
    return !!found;
  }
}
