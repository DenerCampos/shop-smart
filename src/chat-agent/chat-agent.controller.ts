import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { seconds, Throttle } from '@nestjs/throttler';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { paginationData } from 'src/common/pagination/pagination';
import { User } from 'src/user/entities/user.entity';
import { ChatAgentService } from './chat-agent.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatMessagesQueryDto } from './dto/chat-messages-query.dto';
import { ChatSessionResponseDto } from './dto/chat-session-response.dto';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { SendChatMessageResponseDto } from './dto/send-chat-message-response.dto';

@Controller('chat-agent')
@UseGuards(AuthGuard)
@Throttle({ default: { limit: 20, ttl: seconds(60) } })
export class ChatAgentController {
  constructor(
    private readonly chatAgentService: ChatAgentService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('sessions')
  async createSession(
    @CurrentUser() user: User,
    @Body() dto: CreateChatSessionDto,
  ): Promise<ChatSessionResponseDto> {
    const session = await this.chatAgentService.createSession(user, dto);
    return this.responseService.mapToDto(ChatSessionResponseDto, session);
  }

  @Get('sessions')
  async listSessions(
    @CurrentUser() user: User,
  ): Promise<ChatSessionResponseDto[]> {
    const sessions = await this.chatAgentService.listSessions(user);
    return this.responseService.mapArrayToDto(ChatSessionResponseDto, sessions);
  }

  @Get('sessions/:id/messages')
  async getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ChatMessagesQueryDto,
  ): Promise<paginationData<ChatMessageResponseDto>> {
    const result = await this.chatAgentService.getMessages(user, id, query);
    return this.responseService.mapPaginatedToDto(
      ChatMessageResponseDto,
      result,
    );
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendChatMessageDto,
  ): Promise<SendChatMessageResponseDto> {
    const result = await this.chatAgentService.sendMessage(user, id, dto);
    return this.responseService.mapToDto(SendChatMessageResponseDto, {
      userMessage: this.responseService.mapToDto(
        ChatMessageResponseDto,
        result.userMessage,
      ),
      assistantMessage: this.responseService.mapToDto(
        ChatMessageResponseDto,
        result.assistantMessage,
      ),
    });
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async deleteSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.chatAgentService.softDeleteSession(user, id);
  }
}
