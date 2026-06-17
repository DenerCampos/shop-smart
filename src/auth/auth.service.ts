import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter } from 'events';
import { UserService } from '../user/user.service';
import { FamilyGroupService } from '../family-group/family-group.service';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { OauthAuthorizeDto } from './dto/oauth-authorize.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { OauthTokenDto } from './dto/oauth-token.dto';
import { OauthClient } from './entities/oauth-client.entity';
import { OauthCode } from './entities/oauth-code.entity';
import { OauthConnection } from './entities/oauth-connection.entity';
import { jwtTokenType } from './types/jwtTokenType';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../common/app-config/app.config';
import { SecurityAuditLogService } from '../common/logging/security-audit-log.service';
import { logJson } from '../common/logging/log-event.util';
import { EVENT_EMITTER } from '../common/event-emitter/event-emitter.provider';
import { v4 as uuidv4 } from 'uuid';

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

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private appConfig: AppConfig,
    private securityAuditLog: SecurityAuditLogService,
    private familyGroupService: FamilyGroupService,
    @InjectRepository(OauthClient)
    private oauthClientRepository: Repository<OauthClient>,
    @InjectRepository(OauthCode)
    private oauthCodeRepository: Repository<OauthCode>,
    @InjectRepository(OauthConnection)
    private oauthConnectionRepository: Repository<OauthConnection>,
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

    const payload = { sub: user.id, username: user.email };
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

    const payload = { sub: user.id, username: user.email, isDemo: true };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '2h',
    });

    await this.usersService.saveToken(user.id, accessToken);

    return { accessToken };
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

    const payload = { sub: user.id, username: user.email };
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

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.email,
      familyGroupId,
    });

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

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.email,
      familyGroupId,
    });

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
      const groups = await this.familyGroupService.findGroupsByUser(userId);
      return groups.length > 0 ? groups[0].id : null;
    } catch {
      return null;
    }
  }

  private scheduleSessionCleanup(sessionCode: string): void {
    setTimeout(() => {
      this.oauthSessions.delete(sessionCode);
    }, this.SESSION_TTL_MS);
  }
}
