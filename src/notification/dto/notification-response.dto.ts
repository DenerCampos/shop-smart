import { Expose } from 'class-transformer';
import { NotificationType } from '../types/notification-type.type';

export class NotificationResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: NotificationType;

  @Expose()
  title: string;

  @Expose()
  body: string;

  @Expose()
  actorName: string;

  @Expose()
  actionUrl: string | null;

  @Expose()
  data: Record<string, unknown> | null;

  @Expose()
  readAt: Date | null;

  @Expose()
  createdAt: Date;
}
