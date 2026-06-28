import { EntityManager } from 'typeorm';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';

export interface IHealthMemberRepository {
  findMembership(
    userId: string,
    manager?: EntityManager,
  ): Promise<FamilyGroupMember | null>;

  findMembershipWithGroup(
    userId: string,
    manager?: EntityManager,
  ): Promise<FamilyGroupMember | null>;

  isMemberOfGroup(
    userId: string,
    groupId: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
