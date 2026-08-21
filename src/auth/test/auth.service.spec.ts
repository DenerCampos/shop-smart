import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { AppConfig } from '../../common/app-config/app.config';
import { SecurityAuditLogService } from '../../common/logging/security-audit-log.service';
import { OauthClient } from '../entities/oauth-client.entity';
import { OauthCode } from '../entities/oauth-code.entity';
import { OauthConnection } from '../entities/oauth-connection.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailService } from '../../email/email.service';
import { User } from '../../user/entities/user.entity';
import { createRepositoryMock } from '../../common/test/typeorm-repository.mock';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';
import { UserLimitReachedException } from '../../exception/authErrorException';

describe('AuthService', () => {
  beforeAll(() => {
    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation(() => 0 as unknown as NodeJS.Timeout);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<
      UserService,
      | 'findByEmail'
      | 'findByEmailWithDeleted'
      | 'saveToken'
      | 'saveRefreshToken'
      | 'findByRefreshToken'
      | 'restore'
      | 'countActiveUsers'
      | 'getUserLimit'
      | 'update'
      | 'clearAuthTokens'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let securityAuditLog: jest.Mocked<
    Pick<
      SecurityAuditLogService,
      | 'authLoginFailed'
      | 'authRefreshFailed'
      | 'passwordResetRequested'
      | 'passwordResetFailed'
      | 'passwordResetCompleted'
      | 'accountRecoveryRequested'
    >
  >;
  let oauthClientRepo: ReturnType<typeof createRepositoryMock<OauthClient>>;
  let oauthCodeRepo: ReturnType<typeof createRepositoryMock<OauthCode>>;
  let oauthConnectionRepo: ReturnType<
    typeof createRepositoryMock<OauthConnection>
  >;
  let passwordResetRepo: ReturnType<
    typeof createRepositoryMock<PasswordResetToken>
  >;
  let userRepoInTx: {
    update: jest.Mock;
    findOne: jest.Mock;
    restore: jest.Mock;
  };
  let emailService: jest.Mocked<
    Pick<EmailService, 'sendPasswordReset' | 'sendAccountRecovery'>
  >;
  let familyGroupService: jest.Mocked<
    Pick<FamilyGroupService, 'findGroupsByUser'>
  >;

  const testEmail = 'user@test.local';
  const plainPassword = 'test-password-1';

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithDeleted: jest.fn(),
      saveToken: jest.fn(),
      saveRefreshToken: jest.fn(),
      findByRefreshToken: jest.fn(),
      restore: jest.fn().mockResolvedValue(true),
      countActiveUsers: jest.fn().mockResolvedValue(1),
      getUserLimit: jest.fn().mockReturnValue(15),
      update: jest.fn(),
      clearAuthTokens: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-access-token') };
    securityAuditLog = {
      authLoginFailed: jest.fn(),
      authRefreshFailed: jest.fn(),
      passwordResetRequested: jest.fn(),
      passwordResetFailed: jest.fn(),
      passwordResetCompleted: jest.fn(),
      accountRecoveryRequested: jest.fn(),
    };
    oauthClientRepo = createRepositoryMock<OauthClient>();
    oauthCodeRepo = createRepositoryMock<OauthCode>();
    oauthConnectionRepo = createRepositoryMock<OauthConnection>();
    passwordResetRepo = createRepositoryMock<PasswordResetToken>();
    passwordResetRepo.find.mockResolvedValue([]);
    userRepoInTx = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue(null),
      restore: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    emailService = {
      sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
      sendAccountRecovery: jest.fn().mockResolvedValue({ success: true }),
    };
    familyGroupService = { findGroupsByUser: jest.fn().mockResolvedValue([]) };

    const appConfig = createAppConfigMock();
    const dataSource = {
      transaction: jest.fn(async (cb: (manager: unknown) => Promise<void>) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === PasswordResetToken) return passwordResetRepo;
            if (entity === User) return userRepoInTx;
            throw new Error('unexpected entity');
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AppConfig, useValue: appConfig },
        { provide: SecurityAuditLogService, useValue: securityAuditLog },
        { provide: FamilyGroupService, useValue: familyGroupService },
        { provide: EmailService, useValue: emailService },
        {
          provide: getRepositoryToken(OauthClient),
          useValue: oauthClientRepo,
        },
        { provide: getRepositoryToken(OauthCode), useValue: oauthCodeRepo },
        {
          provide: getRepositoryToken(OauthConnection),
          useValue: oauthConnectionRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetRepo,
        },
        { provide: DataSource, useValue: dataSource },
        provideEventEmitterMock(),
      ],
    }).compile();

    service = module.get(AuthService);
  });

  async function userWithPassword(): Promise<User> {
    const hash = await bcrypt.hash(plainPassword, 4);
    const u = new User();
    u.id = 'user-uuid-1';
    u.email = testEmail;
    u.password = hash;
    u.name = 'Test';
    u.family = 'Fam';
    u.coatOfArms = '/x.png';
    u.token = 'old-access';
    return u;
  }

  describe('signIn', () => {
    it('retorna accessToken quando credenciais são válidas', async () => {
      const user = await userWithPassword();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);

      const result = await service.signIn({
        email: testEmail,
        password: plainPassword,
      });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        username: user.email,
        ver: 0,
      });
      expect(usersService.saveToken).toHaveBeenCalledWith(
        user.id,
        'jwt-access-token',
      );
      expect(securityAuditLog.authLoginFailed).not.toHaveBeenCalled();
    });

    it('lança Unauthorized e audita quando usuário não existe', async () => {
      usersService.findByEmailWithDeleted.mockResolvedValue(null);

      await expect(
        service.signIn({ email: testEmail, password: plainPassword }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(securityAuditLog.authLoginFailed).toHaveBeenCalledWith(testEmail);
    });

    it('lança Unauthorized e audita quando senha é inválida', async () => {
      const user = await userWithPassword();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);

      await expect(
        service.signIn({ email: testEmail, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(securityAuditLog.authLoginFailed).toHaveBeenCalledWith(testEmail);
    });

    it('lança ACCOUNT_DELETED_REACTIVATION_REQUIRED quando senha está correta e a conta está soft-deleted', async () => {
      const user = await userWithPassword();
      user.deletedAt = new Date();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);

      await expect(
        service.signIn({ email: testEmail, password: plainPassword }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'ACCOUNT_DELETED_REACTIVATION_REQUIRED',
        }),
      });
      expect(usersService.saveToken).not.toHaveBeenCalled();
    });

    it('lança Unauthorized quando a senha está errada mesmo com conta soft-deleted', async () => {
      const user = await userWithPassword();
      user.deletedAt = new Date();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);

      await expect(
        service.signIn({ email: testEmail, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(securityAuditLog.authLoginFailed).toHaveBeenCalledWith(testEmail);
    });
  });

  describe('refreshToken', () => {
    it('retorna novo accessToken quando refresh é válido', async () => {
      const user = await userWithPassword();
      user.token = 'stored-refresh';
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.refreshToken({
        email: testEmail,
        token: 'stored-refresh',
      });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(usersService.saveToken).toHaveBeenCalledWith(
        user.id,
        'jwt-access-token',
      );
    });

    it('audita e lança quando usuário não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.refreshToken({ email: testEmail, token: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(securityAuditLog.authRefreshFailed).toHaveBeenCalledWith(
        testEmail,
        'user_not_found',
      );
    });

    it('audita e lança quando token não confere', async () => {
      const user = await userWithPassword();
      user.token = 'a';
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.refreshToken({ email: testEmail, token: 'b' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(securityAuditLog.authRefreshFailed).toHaveBeenCalledWith(
        testEmail,
        'invalid_refresh',
      );
    });
  });

  describe('recoverAccount', () => {
    const flush = () => new Promise((resolve) => setImmediate(resolve));

    it('envia e-mail de recuperação quando a conta está soft-deleted', async () => {
      const user = await userWithPassword();
      user.deletedAt = new Date();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);
      passwordResetRepo.findOne.mockResolvedValue(null);

      const result = await service.recoverAccount({ email: testEmail });
      await flush();

      expect(result.message).toContain('Se este e-mail estiver cadastrado');
      expect(emailService.sendAccountRecovery).toHaveBeenCalled();
      expect(securityAuditLog.accountRecoveryRequested).toHaveBeenCalledWith(
        testEmail,
        'sent',
      );
    });

    it('responde igual e não envia quando a conta não existe', async () => {
      usersService.findByEmailWithDeleted.mockResolvedValue(null);

      const result = await service.recoverAccount({ email: testEmail });

      expect(result.message).toContain('Se este e-mail estiver cadastrado');
      expect(emailService.sendAccountRecovery).not.toHaveBeenCalled();
      expect(securityAuditLog.accountRecoveryRequested).toHaveBeenCalledWith(
        testEmail,
        'unknown_email',
      );
    });

    it('responde igual e não envia quando a conta está ativa', async () => {
      const user = await userWithPassword();
      usersService.findByEmailWithDeleted.mockResolvedValue(user);

      await service.recoverAccount({ email: testEmail });

      expect(emailService.sendAccountRecovery).not.toHaveBeenCalled();
      expect(securityAuditLog.accountRecoveryRequested).toHaveBeenCalledWith(
        testEmail,
        'active_account',
      );
    });
  });

  describe('oauthAuthorize', () => {
    it('rejeita response_type diferente de code', async () => {
      await expect(
        service.oauthAuthorize({
          response_type: 'token' as any,
          client_id: 'c',
          redirect_uri: 'https://app/cb',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('retorna URL do frontend com session_code quando cliente é válido', async () => {
      oauthClientRepo.findOne.mockResolvedValue({
        id: 'cli-internal',
        clientId: 'alexa',
        slug: 'alexa',
        name: 'Alexa',
        clientSecret: 'x',
        redirectUris: ['https://skill/cb'],
      } as OauthClient);

      const url = await service.oauthAuthorize({
        response_type: 'code',
        client_id: 'alexa',
        redirect_uri: 'https://skill/cb',
        state: 's',
      });

      expect(url).toContain('/alexa-login?session_code=');
      expect(url.startsWith('http://localhost:5173')).toBe(true);
    });
  });

  describe('getIntegrations', () => {
    it('monta mapa connected por slug', async () => {
      const linkedAt = new Date('2024-01-01');
      oauthClientRepo.find.mockResolvedValue([
        { slug: 'alexa', id: '1' } as OauthClient,
        { slug: 'other', id: '2' } as OauthClient,
      ]);
      oauthConnectionRepo.find.mockResolvedValue([
        {
          client: { slug: 'alexa' },
          linkedAt,
        } as OauthConnection,
      ]);

      const result = await service.getIntegrations('user-1');

      expect(result.alexa).toEqual({ connected: true, linkedAt });
      expect(result.other).toEqual({ connected: false });
    });
  });

  describe('forgotPassword', () => {
    const flush = () => new Promise((resolve) => setImmediate(resolve));

    it('envia e-mail com token e grava apenas o hash', async () => {
      const user = await userWithPassword();
      usersService.findByEmail.mockResolvedValue(user);
      passwordResetRepo.findOne.mockResolvedValue(null);

      await service.forgotPassword({ email: testEmail });
      await flush();

      const saved = passwordResetRepo.save.mock
        .calls[0][0] as PasswordResetToken;
      const sentToken = emailService.sendPasswordReset.mock.calls[0][0].token;

      expect(sentToken).toHaveLength(64);
      expect(saved.tokenHash).not.toBe(sentToken);
      expect(saved.tokenHash).toHaveLength(64);
      expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(securityAuditLog.passwordResetRequested).toHaveBeenCalledWith(
        testEmail,
        'sent',
      );
    });

    it('registra send_failed quando o provider não envia', async () => {
      const user = await userWithPassword();
      usersService.findByEmail.mockResolvedValue(user);
      passwordResetRepo.findOne.mockResolvedValue(null);
      emailService.sendPasswordReset.mockResolvedValue({
        success: false,
        error: 'brevo_http_401',
      });

      await service.forgotPassword({ email: testEmail });
      await flush();

      expect(securityAuditLog.passwordResetRequested).toHaveBeenCalledWith(
        testEmail,
        'send_failed',
      );
    });

    it('responde igual e não envia e-mail quando a conta não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'desconhecido@test.local',
      });

      expect(result.message).toContain('Se este e-mail estiver cadastrado');
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(passwordResetRepo.save).not.toHaveBeenCalled();
    });

    it('não reenvia dentro do cooldown', async () => {
      const user = await userWithPassword();
      usersService.findByEmail.mockResolvedValue(user);
      passwordResetRepo.findOne.mockResolvedValue({
        id: 'recent',
      } as PasswordResetToken);

      await service.forgotPassword({ email: testEmail });

      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(securityAuditLog.passwordResetRequested).toHaveBeenCalledWith(
        testEmail,
        'cooldown',
      );
    });

    it('descarta tokens anteriores não usados', async () => {
      const user = await userWithPassword();
      usersService.findByEmail.mockResolvedValue(user);
      passwordResetRepo.findOne.mockResolvedValue(null);
      passwordResetRepo.find.mockResolvedValue([
        { id: 'old-1' },
        { id: 'old-2' },
      ] as PasswordResetToken[]);

      await service.forgotPassword({ email: testEmail });

      expect(passwordResetRepo.delete).toHaveBeenCalledWith(['old-1', 'old-2']);
    });
  });

  describe('resetPassword', () => {
    const rawToken = 'a'.repeat(64);

    function validRecord(user: User): PasswordResetToken {
      return {
        id: 'token-1',
        tokenHash: 'hash',
        userId: user.id,
        user,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        createdAt: new Date(),
      };
    }

    it('troca a senha, marca o token como usado, incrementa tokenVersion e autentica', async () => {
      const user = await userWithPassword();
      user.tokenVersion = 0;
      const record = validRecord(user);
      passwordResetRepo.findOne.mockResolvedValue(record);
      userRepoInTx.findOne.mockResolvedValue(user);

      const result = await service.resetPassword({
        token: rawToken,
        password: 'nova-senha-1',
      });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(userRepoInTx.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          tokenVersion: 1,
          token: null,
          refreshtoken: null,
        }),
      );
      expect(passwordResetRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'token-1', usedAt: expect.any(Date) }),
      );
      expect(usersService.saveToken).toHaveBeenCalledWith(
        user.id,
        'jwt-access-token',
      );
      expect(securityAuditLog.passwordResetCompleted).toHaveBeenCalledWith(
        user.id,
      );
    });

    it('rejeita token inexistente', async () => {
      passwordResetRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: rawToken, password: 'nova-senha-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepoInTx.update).not.toHaveBeenCalled();
    });

    it('rejeita token expirado', async () => {
      const user = await userWithPassword();
      passwordResetRepo.findOne.mockResolvedValue({
        ...validRecord(user),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: rawToken, password: 'nova-senha-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita token já usado', async () => {
      const user = await userWithPassword();
      passwordResetRepo.findOne.mockResolvedValue({
        ...validRecord(user),
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword({ token: rawToken, password: 'nova-senha-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('restaura conta soft-deleted, define senha e retorna accessToken', async () => {
      const user = await userWithPassword();
      user.deletedAt = new Date();
      user.tokenVersion = 0;
      passwordResetRepo.findOne.mockResolvedValue(validRecord(user));
      userRepoInTx.findOne.mockResolvedValue(user);

      const result = await service.resetPassword({
        token: rawToken,
        password: 'nova-senha-1',
      });

      expect(userRepoInTx.restore).toHaveBeenCalledWith(user.id);
      expect(result.accessToken).toBe('jwt-access-token');
      expect(usersService.saveToken).toHaveBeenCalledWith(
        user.id,
        'jwt-access-token',
      );
    });

    it('lança UserLimitReachedException ao reativar quando o limite de ativos foi atingido', async () => {
      const user = await userWithPassword();
      user.deletedAt = new Date();
      passwordResetRepo.findOne.mockResolvedValue(validRecord(user));
      userRepoInTx.findOne.mockResolvedValue(user);
      usersService.countActiveUsers.mockResolvedValue(15);

      await expect(
        service.resetPassword({ token: rawToken, password: 'nova-senha-1' }),
      ).rejects.toBeInstanceOf(UserLimitReachedException);
      expect(userRepoInTx.update).not.toHaveBeenCalled();
    });
  });
});
