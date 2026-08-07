import { Notification } from '../entities/notification.entity';
import { NotificationData } from '../types/notify-input.type';
import { NotificationType } from '../types/notification-type.type';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actorName: string;
  actionUrl: string | null;
  data: NotificationData;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findByUserId(userId: string, limit: number): Promise<Notification[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAsReadByIds(userId: string, ids: string[]): Promise<number>;
}
