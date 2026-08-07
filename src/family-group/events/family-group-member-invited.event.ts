export const FAMILY_GROUP_MEMBER_INVITED_EVENT = 'family_group.member_invited';

export class FamilyGroupMemberInvitedEvent {
  constructor(
    public readonly recipientUserId: string,
    public readonly actorName: string,
    public readonly groupId: string,
    public readonly groupName: string,
    public readonly memberId: string,
    public readonly createdAt: Date,
  ) {}
}
