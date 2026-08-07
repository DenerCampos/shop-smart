import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CHAT_MESSAGE_ROLES } from './types/chat-message-role.type';
import { ChatAuthContext } from './types/chat-auth-context.type';
import { GeminiChatProvider } from './providers/gemini-chat.provider';
import { buildChatAgentSystemPrompt } from 'src/common/prompts/chat-agent.prompt';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatMessagesQueryDto } from './dto/chat-messages-query.dto';

@Injectable()
export class ChatAgentService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly familyMemberResolver: FamilyMemberResolverService,
    private readonly geminiChat: GeminiChatProvider,
    private readonly pagination: Pagination,
    private readonly appConfig: AppConfig,
  ) {}

  async createSession(
    user: User,
    dto: CreateChatSessionDto,
  ): Promise<ChatSession> {
    const session = this.sessionRepo.create({
      userId: user.id,
      title: dto.title?.trim() || null,
    });
    return this.sessionRepo.save(session);
  }

  async listSessions(user: User): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { userId: user.id },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Página 1 = mensagens mais recentes (20).
   * Páginas seguintes = mensagens mais antigas (scroll para cima no front).
   * `data` vem em ordem cronológica (ASC) dentro da página.
   */
  async getMessages(
    user: User,
    sessionId: string,
    query: ChatMessagesQueryDto,
  ): Promise<paginationData<ChatMessage>> {
    await this.assertSessionOwner(user.id, sessionId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = this.pagination.getOffset(page, limit);

    const [rowsDesc, total] = await this.messageRepo.findAndCount({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const data = [...rowsDesc].reverse();
    const baseUrl = `${this.appConfig.getBaseUrl()}/chat-agent/sessions/${sessionId}/messages`;

    return this.pagination.paginateData(data, page, limit, total, baseUrl);
  }

  async softDeleteSession(user: User, sessionId: string): Promise<void> {
    const session = await this.assertSessionOwner(user.id, sessionId);
    await this.sessionRepo.softRemove(session);
  }

  async sendMessage(
    user: User,
    sessionId: string,
    dto: SendChatMessageDto,
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    const session = await this.assertSessionOwner(user.id, sessionId);
    const auth = await this.buildAuthContext(user);

    // Quota / config antes de persistir — evita mensagens órfãs em 429.
    await this.geminiChat.assertCanStartTurn();

    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: session.id,
        role: CHAT_MESSAGE_ROLES.USER,
        content: dto.message.trim(),
        screenContext: dto.screenContext?.trim() || null,
        toolTrace: null,
      }),
    );

    const prior = await this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
      take: 40,
    });

    const history = prior
      .filter((m) => m.id !== userMessage.id)
      .filter(
        (m) =>
          m.role === CHAT_MESSAGE_ROLES.USER ||
          m.role === CHAT_MESSAGE_ROLES.ASSISTANT,
      )
      .map((m) => ({
        role:
          m.role === CHAT_MESSAGE_ROLES.USER
            ? ('user' as const)
            : ('model' as const),
        text: m.content,
      }));

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = buildChatAgentSystemPrompt({
      userName: user.name,
      isAdmin: auth.isAdmin,
      groupId: auth.groupId,
      screenContext: dto.screenContext,
      today,
    });

    try {
      const result = await this.geminiChat.ask({
        systemPrompt,
        history,
        userMessage: dto.message.trim(),
        auth,
      });

      const assistantMessage = await this.messageRepo.save(
        this.messageRepo.create({
          sessionId: session.id,
          role: CHAT_MESSAGE_ROLES.ASSISTANT,
          content: result.text,
          screenContext: dto.screenContext?.trim() || null,
          toolTrace: result.toolTrace.length ? result.toolTrace : null,
        }),
      );

      if (!session.title) {
        session.title = dto.message.trim().slice(0, 80);
        await this.sessionRepo.save(session);
      } else {
        await this.sessionRepo.update(session.id, { updatedAt: new Date() });
      }

      return { userMessage, assistantMessage };
    } catch (err) {
      // Mensagem do usuário já persistida (ex.: 502 Gemini). Mantém no histórico
      // para o cliente refetch; só atualiza touched da sessão.
      await this.sessionRepo.update(session.id, { updatedAt: new Date() });
      throw err;
    }
  }

  private async assertSessionOwner(
    userId: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Sessão não pertence a este usuário');
    }
    return session;
  }

  private async buildAuthContext(user: User): Promise<ChatAuthContext> {
    const groupId = await this.familyMemberResolver.getPrimaryFamilyGroupId(
      user.id,
    );
    const resolved = await this.familyMemberResolver.resolve(user.id, groupId);
    const groupMemberUserIds =
      await this.familyMemberResolver.getAcceptedMemberUserIds(
        user.id,
        groupId,
      );
    return {
      user,
      isAdmin: resolved.isAdmin,
      groupId: resolved.groupId,
      financialUserIds: resolved.userIds,
      groupMemberUserIds,
    };
  }
}
