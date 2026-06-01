import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';

function minimalExpenseBody(overrides: Record<string, unknown> = {}) {
  return {
    name: `Despesa missão e2e ${Date.now()}`,
    value: 50,
    repeat: false,
    store: { name: `Loja missão e2e ${Date.now()}` },
    uri: '',
    date: new Date().toISOString(),
    items: [
      {
        code: '1',
        name: 'Item e2e',
        quantity: 1,
        unit: 'un',
        value: 50,
        total: 50,
        group: { name: 'Alimentação' },
      },
    ],
    payment: { name: 'Dinheiro' },
    ...overrides,
  };
}

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

  it('POST /expense — conclui missão daily_coupon', async () => {
    await request(app.getHttpServer())
      .post('/expense')
      .set(auth())
      .send(minimalExpenseBody())
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    const dailyCoupon = listRes.body.find(
      (item: { mission: { key: string } }) =>
        item.mission.key === 'daily_coupon',
    );

    expect(dailyCoupon).toBeDefined();
    expect(dailyCoupon.progress).toEqual(
      expect.objectContaining({
        isCompleted: true,
        id: expect.any(String),
      }),
    );
  });

  it('POST /revenue — conclui missão daily_revenue', async () => {
    await request(app.getHttpServer())
      .post('/revenue')
      .set(auth())
      .send({
        name: `Receita missão e2e ${Date.now()}`,
        value: 200,
        repeat: false,
        date: new Date().toISOString(),
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    const dailyRevenue = listRes.body.find(
      (item: { mission: { key: string } }) =>
        item.mission.key === 'daily_revenue',
    );

    expect(dailyRevenue).toBeDefined();
    expect(dailyRevenue.progress).toEqual(
      expect.objectContaining({
        isCompleted: true,
        id: expect.any(String),
      }),
    );
    expect(dailyRevenue.mission.rewardCoins).toBe(20);
  });

  it('POST /expense após receita — atualiza missão mensal monthly_spend_under_80', async () => {
    const now = new Date().toISOString();

    await request(app.getHttpServer())
      .post('/revenue')
      .set(auth())
      .send({
        name: `Receita mensal e2e ${Date.now()}`,
        value: 999_999,
        repeat: false,
        date: now,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/expense')
      .set(auth())
      .send(minimalExpenseBody({ value: 100, date: now }))
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/missions')
      .set(auth())
      .expect(200);

    const monthly80 = listRes.body.find(
      (item: { mission: { key: string } }) =>
        item.mission.key === 'monthly_spend_under_80',
    );

    expect(monthly80).toBeDefined();
    expect(monthly80.progress).toEqual(
      expect.objectContaining({
        isCompleted: true,
        id: expect.any(String),
      }),
    );
  });
});
