import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { FamilyGroupService } from '../../family-group/family-group.service';
import { AppConfig } from '../../common/app-config/app.config';
import { SecurityAuditLogService } from '../../common/logging/security-audit-log.service';
import { OauthClient } from '../entities/oauth-client.entity';
import { OauthCode } from '../entities/oauth-code.entity';
import { OauthConnection } from '../entities/oauth-connection.entity';
import { createRepositoryMock } from '../../common/test/typeorm-repository.mock';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('AuthController (integração)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const usersService = {
      findByEmail: jest.fn(),
      saveToken: jest.fn(),
      saveRefreshToken: jest.fn(),
      findByRefreshToken: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
    };
    const securityAuditLog = {
      authLoginFailed: jest.fn(),
      authRefreshFailed: jest.fn(),
    };
    const oauthClientRepo = createRepositoryMock<OauthClient>();
    const oauthCodeRepo = createRepositoryMock<OauthCode>();
    const oauthConnectionRepo = createRepositoryMock<OauthConnection>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UserService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AppConfig, useValue: createAppConfigMock() },
        { provide: SecurityAuditLogService, useValue: securityAuditLog },
        {
          provide: FamilyGroupService,
          useValue: { findGroupsByUser: jest.fn().mockResolvedValue([]) },
        },
        { provide: getRepositoryToken(OauthClient), useValue: oauthClientRepo },
        { provide: getRepositoryToken(OauthCode), useValue: oauthCodeRepo },
        {
          provide: getRepositoryToken(OauthConnection),
          useValue: oauthConnectionRepo,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login retorna 400 quando body inválido', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });
});
