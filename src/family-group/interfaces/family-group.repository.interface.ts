import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMember } from '../entities/family-group-member.entity';
import { FamilyGroupRole } from '../types/family-group-role.type';
import { FamilyGroupMemberStatus } from '../types/family-group-member-status.type';

export interface IFamilyGroupRepository {
  createGroup(name: string, owner: User): Promise<FamilyGroup>;
  findGroupById(id: string): Promise<FamilyGroup | null>;
  findGroupsByUserId(userId: string): Promise<FamilyGroup[]>;
  updateGroup(group: FamilyGroup, name: string): Promise<FamilyGroup>;
  deleteGroup(id: string): Promise<boolean>;

  createMember(
    familyGroup: FamilyGroup,
    user: User | null,
    invitedEmail: string,
    role: FamilyGroupRole,
    status: FamilyGroupMemberStatus,
    invitedBy: User,
  ): Promise<FamilyGroupMember>;
  findMemberById(id: string): Promise<FamilyGroupMember | null>;
  findMembersByGroupId(groupId: string): Promise<FamilyGroupMember[]>;
  findMemberByGroupAndUser(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember | null>;
  findMemberByGroupAndEmail(
    groupId: string,
    email: string,
  ): Promise<FamilyGroupMember | null>;
  findPendingInvitationsByUserId(userId: string): Promise<FamilyGroupMember[]>;
  findPendingInvitationsByEmail(email: string): Promise<FamilyGroupMember[]>;
  findAcceptedMembershipByUserId(
    userId: string,
  ): Promise<FamilyGroupMember | null>;
  updateMemberRole(
    member: FamilyGroupMember,
    role: FamilyGroupRole,
  ): Promise<FamilyGroupMember>;
  updateMemberStatus(
    member: FamilyGroupMember,
    status: FamilyGroupMemberStatus,
    joinedAt?: Date,
  ): Promise<FamilyGroupMember>;
  linkUserToMember(
    member: FamilyGroupMember,
    user: User,
  ): Promise<FamilyGroupMember>;
  deleteMember(id: string): Promise<boolean>;
}
