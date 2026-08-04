import { Expose } from 'class-transformer';

export class ChatSessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  title: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
