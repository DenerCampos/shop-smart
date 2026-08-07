import { Expose } from 'class-transformer';

export class MarkNotificationsReadResponseDto {
  @Expose()
  updated: number;
}
