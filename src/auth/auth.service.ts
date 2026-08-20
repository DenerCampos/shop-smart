import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { EventEmitter } from 'events';
import { UserService } from '../user/user.service';
import { FamilyGroupService } from '../family-group/family-group.service';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { OauthAuthorizeDto } from './dto/oauth-authorize.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { OauthTokenDto } from './dto/oauth-token.dto';
import { ReactivateAccountDto } from './dto/reactivate-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OauthClient } from './entities/oauth-client.entity';
import { OauthCode } from './entities/oauth-code.entity';
import { OauthConnection } from './entities/oauth-connection.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { accessTokenVersion } from './jwt-access.util';
import { EmailService } from 'src/email/email.service';
import { jwtTokenType } from './types/jwtTokenType';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../common/app-config/app.config';
import { SecurityAuditLogService } from '../common/logging/security-audit-log.service';
import { logJson } from '../common/logging/log-event.util';
import { EVENT_EMITTER } from '../common/event-emitter/event-emitter.provider';
import {
  InvalidOrExpiredResetTokenException,
  UserLimitReachedException,
} from 'src/exception/authErrorException';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/user/entities/user.entity';

interface OauthSession {
  clientInternalId: string;
  clientId: string;
  redirectUri: string;
  state?: string;
  expiresAt: number;
}

export interface IntegrationStatus {
  connected: boolean;
  linkedAt?: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly oauthSessions = new Map<string, OauthSession>();
  private readonly SESSION_TTL_MS = 10 * 60 * 1000;
  private readonly CODE_TTL_MS = 5 * 60 * 1000;
  /** Evita que repetir "esqueci minha senha" encha a caixa do usuário e queime a cota diária. */
  private readonly PASSWORD_RESET_COOLDOWN_MS = 2 * 60 * 1000;

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private appConfig: AppConfig,
    private securityAuditLog: SecurityAuditLogService,
    private familyGroupService: FamilyGroupService,
    private emailService: EmailService,
    @InjectRepository(OauthClient)
    private oauthClientRepository: Repository<OauthClient>,
    @InjectRepository(OauthCode)
    private oauthCodeRepository: Repository<OauthCode>,
    @InjectRepository(OauthConnection)
    private oauthConnectionRepository: Repository<OauthConnection>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly dataSource: DataSource,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
  ) {}

  async signIn(signInDto: SignInDto): Promise<jwtTokenType> {
    const user = await this.usersService.findByEmail(signInDto.email);

    if (!user) {
      this.securityAuditLog.authLoginFailed(signInDto.email);
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(signInDto.password, user.password);

    if (!isMatch) {
      this.securityAuditLog.authLoginFailed(signInDto.email);
      throw new UnauthorizedException();
    }

    const payload = this.buildAccessPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.saveToken(user.id, accessToken);

    this.eventEmitter.emit('auth.login_success', { userId: user.id });

    return { accessToken };
  }

  async demoLogin(key: string): Promise<jwtTokenType> {
    if (!this.appConfig.isDemoEnabled()) {
      throw new ForbiddenException('Demo desabilitado');
    }

    if (!key) {
      throw new UnauthorizedException('Chave demo inválida');
    }

    const secret = this.appConfig.getDemoSecret();

    const isKeyValid =
      secret.length > 0 &&
      key.length === secret.length &&
      timingSafeEqual(Buffer.from(key), Buffer.from(secret));

    if (!isKeyValid) {
      logJson(
        this.logger,
        { event: 'demo_login_failed', reason: 'invalid_key' },
        'warn',
      );
      throw new UnauthorizedException('Chave demo inválida');
    }

    const demoEmail = this.appConfig.getDemoUserEmail();
    const user = await this.usersService.findByEmail(demoEmail);

    if (!user) {
      throw new NotFoundException('Usuário demo não encontrado');
    }

    const payload = this.buildAccessPayload(user, { isDemo: true });
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '2h',
    });

    await this.usersService.saveToken(user.id, accessToken);

    return { accessToken };
  }

  async reactivateAccount(dto: ReactivateAccountDto): Promise<jwtTokenType> {
    const user = await this.usersService.findByEmailWithDeleted(dto.email);

    if (!user || !user.deletedAt) {
      this.securityAuditLog.authLoginFailed(dto.email);
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      this.securityAuditLog.authLoginFailed(dto.email);
      throw new UnauthorizedException();
    }

    const totalUsers = await this.usersService.countActiveUsers();
    if (totalUsers >= this.usersService.getUserLimit()) {
      throw new UserLimitReachedException();
    }

    const restored = await this.usersService.restore(user.id);
    if (!restored) {
      logJson(
        this.logger,
        {
          event: 'auth_reactivate_restore_failed',
          userId: user.id,
        },
        'error',
      );
      throw new InternalServerErrorException();
    }

    const payload = this.buildAccessPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.saveToken(user.id, accessToken);

    this.eventEmitter.emit('auth.login_success', { userId: user.id });
    this.eventEmitter.emit('user.reactivated', { userId: user.id });

    return { accessToken };
  }

  /**
   * A resposta é idêntica exista ou não a conta: qualquer diferença
   * transformaria a rota em um oráculo de e-mails cadastrados.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Se este e-mail estiver cadastrado, enviaremos as instruções de redefinição em instantes.',
    };

    // findByEmail ignora contas soft-deleted: elas usam /auth/reactivate.
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      this.securityAuditLog.passwordResetRequested(dto.email, 'unknown_email');
      return genericResponse;
    }

    const cooldownStart = new Date(
      Date.now() - this.PASSWORD_RESET_COOLDOWN_MS,
    );
    const recentRequest = await this.passwordResetTokenRepository.findOne({
      where: { user: { id: user.id }, createdAt: MoreThan(cooldownStart) },
    });

    if (recentRequest) {
      this.securityAuditLog.passwordResetRequested(dto.email, 'cooldown');
      return genericResponse;
    }

    const staleTokens = await this.passwordResetTokenRepository.find({
      where: { user: { id: user.id }, usedAt: IsNull() },
      select: ['id'],
    });

    if (staleTokens.length > 0) {
      await this.passwordResetTokenRepository.delete(
        staleTokens.map((token) => token.id),
      );
    }

    const token = randomBytes(32).toString('hex');
    const ttlMinutes = this.appConfig.getPasswordResetTokenTtlMinutes();

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        tokenHash: this.hashResetToken(token),
        user,
        userId: user.id,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        usedAt: null,
      }),
    );

    // Persiste o token e responde; o Brevo não pode prender a request nem
    // virar oráculo de timing (conta existente vs. e-mail desconhecido).
    void this.emailService
      .sendPasswordReset({
        to: user.email,
        name: user.name,
        token,
      })
      .then((result) => {
        this.securityAuditLog.passwordResetRequested(
          dto.email,
          result.success ? 'sent' : 'send_failed',
        );
      })
      .catch(() => {
        this.securityAuditLog.passwordResetRequested(dto.email, 'send_failed');
      });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashResetToken(dto.token);
    const passwordHash = await bcrypt.hash(
      dto.password,
      this.appConfig.getSaltEncryption(),
    );

    let userId: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(PasswordResetToken);
      const userRepo = manager.getRepository(User);

      const record = await tokenRepo.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      const isUsable =
        record && !record.usedAt && record.expiresAt.getTime() > Date.now();

      if (!isUsable) {
        this.securityAuditLog.passwordResetFailed('invalid_or_expired_token');
        throw new InvalidOrExpiredResetTokenException();
      }

      const user = await userRepo.findOne({
        where: { id: record.userId },
        withDeleted: true,
      });

      if (!user || user.deletedAt) {
        this.securityAuditLog.passwordResetFailed('inactive_user');
        throw new InvalidOrExpiredResetTokenException();
      }

      userId = user.id;

      await userRepo.update(userId, {
        password: passwordHash,
        tokenVersion: accessTokenVersion(user) + 1,
        token: null,
        refreshtoken: null,
      });

      record.usedAt = new Date();
      await tokenRepo.save(record);
    });

    this.securityAuditLog.passwordResetCompleted(userId as string);

    return { message: 'Senha redefinida com sucesso.' };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<jwtTokenType> {
    const user = await this.usersService.findByEmail(refreshTokenDto.email);

    if (!user) {
      this.securityAuditLog.authRefreshFailed(
        refreshTokenDto.email,
        'user_not_found',
      );
      throw new UnauthorizedException();
    }

    if (user.token !== refreshTokenDto.token) {
      this.securityAuditLog.authRefreshFailed(
        refreshTokenDto.email,
        'invalid_refresh',
      );
      throw new UnauthorizedException();
    }

    const payload = this.buildAccessPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.saveToken(user.id, accessToken);

    this.eventEmitter.emit('auth.login_success', { userId: user.id });

    return { accessToken };
  }

  async oauthAuthorize(dto: OauthAuthorizeDto): Promise<string> {
    if (dto.response_type !== 'code') {
      throw new BadRequestException('response_type deve ser "code"');
    }

    const client = await this.oauthClientRepository.findOne({
      where: { clientId: dto.client_id },
    });

    if (!client) {
      throw new BadRequestException('client_id inválido');
    }

    const isRedirectAllowed = client.redirectUris.some(
      (uri) => uri === dto.redirect_uri,
    );

    if (!isRedirectAllowed) {
      throw new BadRequestException(
        'redirect_uri não permitida para este cliente',
      );
    }

    const sessionCode = uuidv4();

    this.oauthSessions.set(sessionCode, {
      clientInternalId: client.id,
      clientId: client.clientId,
      redirectUri: dto.redirect_uri,
      state: dto.state,
      expiresAt: Date.now() + this.SESSION_TTL_MS,
    });

    this.scheduleSessionCleanup(sessionCode);

    const frontendUrl = this.appConfig.getFrontendUrl();
    return `${frontendUrl}/alexa-login?session_code=${sessionCode}`;
  }

  async oauthLogin(dto: OauthLoginDto): Promise<{ redirectUrl: string }> {
    const session = this.oauthSessions.get(dto.session_code);

    if (!session || Date.now() > session.expiresAt) {
      this.oauthSessions.delete(dto.session_code);
      throw new UnauthorizedException('session_code inválido ou expirado');
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    this.oauthSessions.delete(dto.session_code);

    const code = uuidv4();
    const expiresAt = new Date(Date.now() + this.CODE_TTL_MS);

    await this.oauthCodeRepository.save(
      this.oauthCodeRepository.create({
        code,
        redirectUri: session.redirectUri,
        expiresAt,
        user: { id: user.id },
        client: { id: session.clientInternalId },
      }),
    );

    const params = new URLSearchParams({ code });
    if (session.state) params.set('state', session.state);

    return { redirectUrl: `${session.redirectUri}?${params.toString()}` };
  }

  async oauthToken(dto: OauthTokenDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
  }> {
    const client = await this.oauthClientRepository.findOne({
      where: { clientId: dto.client_id },
    });

    if (!client) {
      throw new UnauthorizedException('client_id inválido');
    }

    const isSecretValid = await bcrypt.compare(
      dto.client_secret,
      client.clientSecret,
    );

    if (!isSecretValid) {
      throw new UnauthorizedException('client_secret inválido');
    }

    if (dto.grant_type === 'authorization_code') {
      return this.handleAuthorizationCode(dto, client);
    }

    if (dto.grant_type === 'refresh_token') {
      return this.handleRefreshToken(dto);
    }

    throw new BadRequestException('grant_type não suportado');
  }

  async getIntegrations(
    userId: string,
  ): Promise<Record<string, IntegrationStatus>> {
    const [allClients, connections] = await Promise.all([
      this.oauthClientRepository.find(),
      this.oauthConnectionRepository.find({
        where: { user: { id: userId } },
        relations: ['client'],
      }),
    ]);

    const connectedMap = new Map(
      connections.map((c) => [c.client.slug, c.linkedAt]),
    );

    return allClients.reduce<Record<string, IntegrationStatus>>(
      (acc, client) => {
        const linkedAt = connectedMap.get(client.slug);
        acc[client.slug] = linkedAt
          ? { connected: true, linkedAt }
          : { connected: false };
        return acc;
      },
      {},
    );
  }

  async unlinkIntegration(
    userId: string,
    slug: string,
  ): Promise<{ unlinked: boolean }> {
    const connection = await this.oauthConnectionRepository.findOne({
      where: { user: { id: userId }, client: { slug } },
      relations: ['client'],
    });

    if (!connection) {
      return { unlinked: false };
    }

    await this.oauthConnectionRepository.remove(connection);
    return { unlinked: true };
  }

  private async handleAuthorizationCode(
    dto: OauthTokenDto,
    client: OauthClient,
  ) {
    if (!dto.code) {
      throw new BadRequestException('code é obrigatório');
    }

    const oauthCode = await this.oauthCodeRepository.findOne({
      where: { code: dto.code },
      relations: ['user', 'client'],
    });

    if (!oauthCode) {
      throw new BadRequestException('code inválido');
    }

    if (oauthCode.client.clientId !== client.clientId) {
      throw new BadRequestException('code não pertence a este client_id');
    }

    if (new Date() > oauthCode.expiresAt) {
      await this.oauthCodeRepository.delete(oauthCode.id);
      throw new BadRequestException('code expirado');
    }

    await this.oauthCodeRepository.delete(oauthCode.id);

    const user = oauthCode.user;
    const familyGroupId = await this.getPrimaryFamilyGroupId(user.id);
    const refreshToken = uuidv4();

    const accessToken = await this.jwtService.signAsync(
      this.buildAccessPayload(user, { familyGroupId }),
    );

    await Promise.all([
      this.usersService.saveRefreshToken(user.id, refreshToken),
      this.upsertConnection(user.id, client.id),
    ]);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
    };
  }

  private async handleRefreshToken(dto: OauthTokenDto) {
    if (!dto.refresh_token) {
      throw new BadRequestException('refresh_token é obrigatório');
    }

    const user = await this.usersService.findByRefreshToken(dto.refresh_token);

    if (!user) {
      throw new UnauthorizedException('refresh_token inválido');
    }

    const familyGroupId = await this.getPrimaryFamilyGroupId(user.id);
    const newRefreshToken = uuidv4();

    const accessToken = await this.jwtService.signAsync(
      this.buildAccessPayload(user, { familyGroupId }),
    );

    await this.usersService.saveRefreshToken(user.id, newRefreshToken);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
    };
  }

  private async upsertConnection(
    userId: string,
    clientInternalId: string,
  ): Promise<void> {
    const existing = await this.oauthConnectionRepository.findOne({
      where: {
        user: { id: userId },
        client: { id: clientInternalId },
      },
    });

    if (existing) {
      await this.oauthConnectionRepository.save({
        ...existing,
        updatedAt: new Date(),
      });
      return;
    }

    await this.oauthConnectionRepository.save(
      this.oauthConnectionRepository.create({
        user: { id: userId },
        client: { id: clientInternalId },
      }),
    );
  }

  private async getPrimaryFamilyGroupId(
    userId: string,
  ): Promise<string | null> {
    try {
      // findGroupsByUser já ordena owner → admin → member
      const groups = await this.familyGroupService.findGroupsByUser(userId);
      return groups.length > 0 ? groups[0].id : null;
    } catch {
      return null;
    }
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildAccessPayload(
    user: User,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      sub: user.id,
      username: user.email,
      ver: accessTokenVersion(user),
      ...extra,
    };
  }

  private scheduleSessionCleanup(sessionCode: string): void {
    setTimeout(() => {
      this.oauthSessions.delete(sessionCode);
    }, this.SESSION_TTL_MS);
  }
}
