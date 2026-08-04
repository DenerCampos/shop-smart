import { Expose } from 'class-transformer';
import { ChatMessageRole } from '../types/chat-message-role.type';

export class ChatMessageResponseDto {
  @Expose()
  id: string;

  @Expose()
  sessionId: string;

  @Expose()
  role: ChatMessageRole;

  @Expose()
  content: string;

  @Expose()
  screenContext: string | null;

  @Expose()
  toolTrace: Array<{ name: string; ok: boolean }> | null;

  @Expose()
  createdAt: Date;
}
