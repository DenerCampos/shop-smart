import { User } from 'src/user/entities/user.entity';

export type ChatAuthContext = {
  user: User;
  isAdmin: boolean;
  groupId: string | null;
  /** userIds financeiros permitidos (admin = família; member/solo = só si) */
  financialUserIds: string[];
  /** todos os membros aceitos do grupo (shared) ou só o user */
  groupMemberUserIds: string[];
};
