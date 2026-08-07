import { NotificationChannelName } from './notification-channel.type';
import { NotificationType } from './notification-type.type';

export type NotificationData = Record<string, unknown> | null;

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actorName: string;
  actionUrl: string | null;
  data?: NotificationData;
  channels?: NotificationChannelName[];
}

export interface NotificationPayload {
  userId: string;
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
  error?: string;
}
