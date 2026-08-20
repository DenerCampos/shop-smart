import { NotificationChannelName } from './notification-channel.type';
import { NotificationType } from './notification-type.type';

export type NotificationData = Record<string, unknown> | null;

/**
 * O destinatário pode vir como `userId` (notificação in-app), como
 * `recipientEmail` (convidado que ainda não tem conta) ou como os dois. O e-mail
 * é sempre explícito: resolver pelo `userId` exigiria o `UserService` aqui
 * dentro e criaria dependência circular com o módulo de usuário.
 */
export interface NotifyInput {
  userId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actorName: string;
  actionUrl: string | null;
  data?: NotificationData;
  channels?: NotificationChannelName[];
}

export interface NotificationPayload {
  userId: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actorName: string;
  actionUrl: string | null;
  data: NotificationData;
}

export interface DeliveryResult {
  channel: NotificationChannelName;
  success: boolean;
  /** Canal não se aplica a este destinatário (ex.: in-app sem `userId`). */
  skipped?: boolean;
  error?: string;
}
