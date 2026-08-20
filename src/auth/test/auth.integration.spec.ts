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
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailService } from '../../email/email.service';
import { createRepositoryMock } from '../../common/test/typeorm-repository.mock';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { provideEventEmitterMock } from '../../common/test/event-emitter.mock';
import { DataSource } from 'typeorm';

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
      passwordResetRequested: jest.fn(),
      passwordResetFailed: jest.fn(),
      passwordResetCompleted: jest.fn(),
    };
    const oauthClientRepo = createRepositoryMock<OauthClient>();
    const oauthCodeRepo = createRepositoryMock<OauthCode>();
    const oauthConnectionRepo = createRepositoryMock<OauthConnection>();
    const passwordResetRepo = createRepositoryMock<PasswordResetToken>();
    const emailService = {
      sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    };

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
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetRepo,
        },
        { provide: EmailService, useValue: emailService },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        provideEventEmitterMock(),
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

  it('POST /auth/forgot-password exige e-mail válido', () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'nao-e-email' })
      .expect(400);
  });

  it('POST /auth/reset-password rejeita token fora do formato', () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'curto', password: 'senha-valida-1' })
      .expect(400);
  });

  it('POST /auth/reset-password rejeita senha curta', () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: '123' })
      .expect(400);
  });
});
