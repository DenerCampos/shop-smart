import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';

describe('Missions (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    token = await loginAsSeedUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => bearerAuth(token);

  it('GET /missions sem token — 401', async () => {
    await request(app.getHttpServer()).get('/missions').expect(401);
  });

  it('GET /missions — 200 lista com mission e progress', async () => {
    const res = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        mission: expect.objectContaining({
          id: expect.any(String),
          key: expect.any(String),
          title: expect.any(String),
          frequency: expect.any(String),
          rewardCoins: expect.any(Number),
          targetValue: expect.any(Number),
        }),
        progress: expect.objectContaining({
          currentValue: expect.any(Number),
          isCompleted: expect.any(Boolean),
          isClaimed: expect.any(Boolean),
        }),
      }),
    );
  });

  it('POST /missions/:progressId/claim sem token — 401', async () => {
    await request(app.getHttpServer())
      .post(`/missions/${randomUUID()}/claim`)
      .expect(401);
  });

  it('POST /missions/:progressId/claim — 404 progresso inexistente', async () => {
    const res = await request(app.getHttpServer())
      .post(`/missions/${randomUUID()}/claim`)
      .set(auth());

    expect(res.status).toBe(404);
  });

  it('POST /missions/:progressId/claim — resgata missão concluída e bloqueia reenvio', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    const dailyLogin = listRes.body.find(
      (item: {
        mission: { key: string };
        progress: {
          isCompleted: boolean;
          isClaimed: boolean;
          id: string | null;
        };
      }) =>
        item.mission.key === 'daily_login' &&
        item.progress.isCompleted &&
        !item.progress.isClaimed &&
        item.progress.id,
    );

    expect(dailyLogin).toBeDefined();

    const claimRes = await request(app.getHttpServer())
      .post(`/missions/${dailyLogin.progress.id}/claim`)
      .set(auth())
      .expect(200);

    expect(claimRes.body).toEqual({ success: true });

    const retryRes = await request(app.getHttpServer())
      .post(`/missions/${dailyLogin.progress.id}/claim`)
      .set(auth());

    expect(retryRes.status).toBe(403);
    expectClientError(retryRes);
  });

  it('POST /missions/:progressId/claim — 403 quando missão não concluída', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    const incomplete = listRes.body.find(
      (item: {
        mission: { key: string };
        progress: { isCompleted: boolean; id: string | null };
      }) =>
        item.progress.id &&
        !item.progress.isCompleted &&
        item.mission.key.startsWith('monthly_spend_under_'),
    );

    if (!incomplete) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post(`/missions/${incomplete.progress.id}/claim`)
      .set(auth());

    expect(res.status).toBe(403);
    expectClientError(res);
  });
});
