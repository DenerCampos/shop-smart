import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { AppConfig } from '../../common/app-config/app.config';
import { SecurityAuditLogService } from '../../common/logging/security-audit-log.service';
import { OauthClient } from '../entities/oauth-client.entity';
import { OauthCode } from '../entities/oauth-code.entity';
import { OauthConnection } from '../entities/oauth-connection.entity';
import { User } from '../../user/entities/user.entity';
import { createRepositoryMock } from '../../common/test/typeorm-repository.mock';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';

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
      'findByEmail' | 'saveToken' | 'saveRefreshToken' | 'findByRefreshToken'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let securityAuditLog: jest.Mocked<
    Pick<SecurityAuditLogService, 'authLoginFailed' | 'authRefreshFailed'>
  >;
  let oauthClientRepo: ReturnType<typeof createRepositoryMock<OauthClient>>;
  let oauthCodeRepo: ReturnType<typeof createRepositoryMock<OauthCode>>;
  let oauthConnectionRepo: ReturnType<
    typeof createRepositoryMock<OauthConnection>
  >;
  let familyGroupService: jest.Mocked<
    Pick<FamilyGroupService, 'findGroupsByUser'>
  >;

  const testEmail = 'user@test.local';
  const plainPassword = 'test-password-1';

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      saveToken: jest.fn(),
      saveRefreshToken: jest.fn(),
      findByRefreshToken: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-access-token') };
    securityAuditLog = {
      authLoginFailed: jest.fn(),
      authRefreshFailed: jest.fn(),
    };
    oauthClientRepo = createRepositoryMock<OauthClient>();
    oauthCodeRepo = createRepositoryMock<OauthCode>();
    oauthConnectionRepo = createRepositoryMock<OauthConnection>();
    familyGroupService = { findGroupsByUser: jest.fn().mockResolvedValue([]) };

    const appConfig = createAppConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AppConfig, useValue: appConfig },
        { provide: SecurityAuditLogService, useValue: securityAuditLog },
        { provide: FamilyGroupService, useValue: familyGroupService },
        {
          provide: getRepositoryToken(OauthClient),
          useValue: oauthClientRepo,
        },
        { provide: getRepositoryToken(OauthCode), useValue: oauthCodeRepo },
        {
          provide: getRepositoryToken(OauthConnection),
          useValue: oauthConnectionRepo,
        },
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
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.signIn({
        email: testEmail,
        password: plainPassword,
      });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        username: user.email,
      });
      expect(usersService.saveToken).toHaveBeenCalledWith(
        user.id,
        'jwt-access-token',
      );
      expect(securityAuditLog.authLoginFailed).not.toHaveBeenCalled();
    });

    it('lança Unauthorized e audita quando usuário não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.signIn({ email: testEmail, password: plainPassword }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(securityAuditLog.authLoginFailed).toHaveBeenCalledWith(testEmail);
    });

    it('lança Unauthorized e audita quando senha é inválida', async () => {
      const user = await userWithPassword();
      usersService.findByEmail.mockResolvedValue(user);

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
});
