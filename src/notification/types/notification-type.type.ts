export const NOTIFICATION_TYPES = {
  FAMILY_GROUP_INVITE: 'family_group_invite',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
