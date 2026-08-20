import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  E2E_SEED_EMAIL,
  E2E_SEED_PASSWORD,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';
import { EmailService } from '../../src/email/email.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login — 200 + accessToken', async () => {
    const token = await loginAsSeedUser(app);
    expect(token.length).toBeGreaterThan(10);
  });

  it('POST /auth/login — 401 credenciais inválidas', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: E2E_SEED_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login — 400 payload inválido (sem email)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: E2E_SEED_PASSWORD });
    expectClientError(res);
  });

  it('PUT /auth/refresh — 200 novo accessToken', async () => {
    const access = await loginAsSeedUser(app);
    const res = await request(app.getHttpServer())
      .put('/auth/refresh')
      .send({ email: E2E_SEED_EMAIL, token: access })
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ accessToken: expect.any(String) }),
    );
    const decodeSub = (jwt: string): string => {
      const payload = JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'),
      ) as { sub: string };
      return payload.sub;
    };
    expect(decodeSub(res.body.accessToken)).toBe(decodeSub(access));
  });

  it('PUT /auth/refresh — 401 token não confere', async () => {
    const res = await request(app.getHttpServer())
      .put('/auth/refresh')
      .send({ email: E2E_SEED_EMAIL, token: 'invalid-token' });
    expect(res.status).toBe(401);
  });

  it('PUT /auth/refresh — 400 body inválido', async () => {
    const res = await request(app.getHttpServer())
      .put('/auth/refresh')
      .send({ email: 'not-an-email', token: 'x' });
    expectClientError(res);
  });

  it('POST /auth/login — 200 com e-mail em caixa diferente (case-insensitive)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: E2E_SEED_EMAIL.toUpperCase(),
        password: E2E_SEED_PASSWORD,
      })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  describe('POST /auth/reactivate (SP-39)', () => {
    it('200 restaura conta soft-deleted com senha correta', async () => {
      const email = `reactivate-ok-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Reactivate Ok', email, password })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/auth/reactivate')
        .send({ email, password })
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({ accessToken: expect.any(String) }),
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);
    });

    it('401 com senha incorreta', async () => {
      const email = `reactivate-bad-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Reactivate Bad', email, password })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/auth/reactivate')
        .send({ email, password: 'WrongPass1' });

      expect(res.status).toBe(401);
    });
  });

  describe('sessão demo — bloqueio de perfil (SP-130)', () => {
    async function demoTokenForSeedUser(): Promise<{
      token: string;
      userId: string;
    }> {
      const access = await loginAsSeedUser(app);
      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(access))
        .expect(200);
      const userId = profile.body.user.id as string;
      const jwtService = app.get(JwtService);
      const token = await jwtService.signAsync(
        { sub: userId, username: E2E_SEED_EMAIL, isDemo: true },
        { expiresIn: '2h' },
      );
      return { token, userId };
    }

    it('PATCH /user/:id — 403 com JWT isDemo', async () => {
      const { token, userId } = await demoTokenForSeedUser();
      const res = await request(app.getHttpServer())
        .patch(`/user/${userId}`)
        .set(bearerAuth(token))
        .send({ name: 'Hack Demo' });
      expect(res.status).toBe(403);
    });

    it('POST /profile/complete-profile — 403 com JWT isDemo', async () => {
      const { token } = await demoTokenForSeedUser();
      const res = await request(app.getHttpServer())
        .post('/profile/complete-profile')
        .set(bearerAuth(token))
        .send({
          family: 'Demo Fam',
          income: 1000,
          name: 'Hack',
          date: '2026-01-01',
          repeatMonthly: false,
        });
      expect(res.status).toBe(403);
    });

    it('GET /profile — 200 com JWT isDemo (leitura ok)', async () => {
      const { token } = await demoTokenForSeedUser();
      await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(token))
        .expect(200);
    });
  });

  describe('POST /auth/forgot-password e reset-password (SP-91)', () => {
    const genericMessage =
      'Se este e-mail estiver cadastrado, enviaremos as instruções de redefinição em instantes.';

    it('e-mail desconhecido e cadastrado devolvem a mesma mensagem', async () => {
      const unknown = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: `missing-${Date.now()}@example.com` })
        .expect(200);

      const known = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: E2E_SEED_EMAIL })
        .expect(200);

      expect(unknown.body).toEqual({ message: genericMessage });
      expect(known.body).toEqual(unknown.body);
    });

    it('400 quando o e-mail é inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nao-e-email' });
      expectClientError(res);
    });

    it('400 quando o token está malformado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'curto', password: 'senha-valida-1' });
      expectClientError(res);
    });

    it('400 quando a senha é curta', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'a'.repeat(64), password: '123' });
      expectClientError(res);
    });

    it('400 com token inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'b'.repeat(64), password: 'senha-valida-1' });
      expectClientError(res);
      expect(res.body).toEqual(
        expect.objectContaining({
          code: 'INVALID_OR_EXPIRED_RESET_TOKEN',
        }),
      );
    });

    it('redefine senha, invalida JWT anterior e permite login com a nova senha', async () => {
      const emailService = app.get(EmailService);
      const sendSpy = jest.spyOn(emailService, 'sendPasswordReset');

      const email = `reset-ok-${Date.now()}@example.com`;
      const oldPassword = 'Valid123';
      const newPassword = 'NovaSenha99';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Reset Ok', email, password: oldPassword })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: oldPassword })
        .expect(200);
      const oldAccess = login.body.accessToken as string;

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(sendSpy).toHaveBeenCalled();
      const token = sendSpy.mock.calls[0][0].token as string;

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token, password: newPassword })
        .expect(200);

      await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(oldAccess))
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: oldPassword })
        .expect(401);

      const relogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: newPassword })
        .expect(200);

      await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(relogin.body.accessToken))
        .expect(200);

      sendSpy.mockRestore();
    });
  });
});
