export const FAMILY_GROUP_MEMBER_INVITED_EVENT = 'family_group.member_invited';

/**
 * `invite` = convite recém-criado pelo admin.
 * `signup_link` = convite que já existia e foi vinculado quando a pessoa se
 * cadastrou; ela está no app neste momento, então não vale mandar e-mail.
 */
export type FamilyGroupInviteOrigin = 'invite' | 'signup_link';

export class FamilyGroupMemberInvitedEvent {
  constructor(
    /** `null` quando o convidado ainda não tem conta: só o e-mail alcança. */
    public readonly recipientUserId: string | null,
    public readonly recipientEmail: string,
    public readonly actorName: string,
    public readonly groupId: string,
    public readonly groupName: string,
    public readonly memberId: string,
    public readonly createdAt: Date,
    public readonly origin: FamilyGroupInviteOrigin = 'invite',
    public readonly recipientName: string | null = null,
  ) {}
}
