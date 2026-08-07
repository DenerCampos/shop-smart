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
});
