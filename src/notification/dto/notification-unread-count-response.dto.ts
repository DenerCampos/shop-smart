import { Expose } from 'class-transformer';

export class NotificationUnreadCountResponseDto {
  @Expose()
  count: number;
}
