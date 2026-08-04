import { Expose, Type } from 'class-transformer';
import { ChatMessageResponseDto } from './chat-message-response.dto';

export class SendChatMessageResponseDto {
  @Expose()
  @Type(() => ChatMessageResponseDto)
  userMessage: ChatMessageResponseDto;

  @Expose()
  @Type(() => ChatMessageResponseDto)
  assistantMessage: ChatMessageResponseDto;
}
