import { FamilyGroupMember } from '../entities/family-group-member.entity';

export class FamilyGroupMemberEvent {
  constructor(public readonly member: FamilyGroupMember) {}
}
