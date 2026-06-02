import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import {
  expectClientError,
  expectPaginatedEnvelope,
} from './helpers/expect-response';

async function getOrCreateFamilyGroupId(
  app: INestApplication,
  token: string,
): Promise<string> {
  const list = await request(app.getHttpServer())
    .get('/family-group')
    .set(bearerAuth(token))
    .expect(200);

  if (Array.isArray(list.body) && list.body.length > 0) {
    return list.body[0].id as string;
  }

  const created = await request(app.getHttpServer())
    .post('/family-group')
    .set(bearerAuth(token))
    .send({ name: `E2e coin statement ${Date.now()}` })
    .expect(201);

  return created.body.id as string;
}

async function approveChoreWithCoins(
  app: INestApplication,
  token: string,
  groupId: string,
  coinReward: number,
): Promise<void> {
  const defRes = await request(app.getHttpServer())
    .post(`/family-groups/${groupId}/chores/definitions`)
    .set(bearerAuth(token))
    .send({
      title: `Tarefa moedas ${Date.now()}`,
      description: 'E2E coin reward',
      rewardValue: 5,
      coinReward,
      requirePhoto: false,
      recurrence: 'once',
    })
    .expect(201);

  expect(defRes.body.id).toBeDefined();

  const openList = await request(app.getHttpServer())
    .get(`/family-groups/${groupId}/chores/occurrences`)
    .query({ page: 1, limit: 10 })
    .set(bearerAuth(token))
    .expect(200);

  const occId = openList.body.data[0].id as string;

  await request(app.getHttpServer())
    .patch(`/family-groups/${groupId}/chores/occurrences/${occId}/start`)
    .set(bearerAuth(token))
    .expect(200);

  await request(app.getHttpServer())
    .post(`/family-groups/${groupId}/chores/occurrences/${occId}/submit`)
    .set(bearerAuth(token))
    .expect(201);

  await request(app.getHttpServer())
    .post(`/family-groups/${groupId}/chores/occurrences/${occId}/approve`)
    .set(bearerAuth(token))
    .expect(201);
}

describe('Coin statement / chore coin rewards (e2e)', () => {
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

  it('GET /coin/statement sem token — 401', async () => {
    await request(app.getHttpServer()).get('/coin/statement').expect(401);
  });

  it('GET /coin/statement — 200 com totais e paginação', async () => {
    await request(app.getHttpServer())
      .post('/coin/addCoins')
      .set(auth())
      .send({ type: 'coupon' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/coin/statement')
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        totals: expect.objectContaining({
          totalEarned: expect.any(Number),
          totalSpent: expect.any(Number),
        }),
        data: expect.any(Array),
        meta: expect.objectContaining({
          currentPage: 1,
          itemsPerPage: 10,
        }),
        links: expect.objectContaining({
          first: expect.any(String),
        }),
      }),
    );

    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amount: expect.any(Number),
          transactionType: expect.any(String),
          createdAt: expect.any(String),
          userId: expect.any(String),
        }),
      );
    }
  });

  it('GET /coin/statement — paginação page/limit', async () => {
    const res = await request(app.getHttpServer())
      .get('/coin/statement')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);

    expectPaginatedEnvelope(res.body);
    expect(res.body.meta.itemsPerPage).toBe(5);
  });

  it('GET /coin/statement — 403 userId fora da família', async () => {
    const res = await request(app.getHttpServer())
      .get('/coin/statement')
      .query({
        userId: '00000000-0000-4000-8000-000000000099',
      })
      .set(auth());

    expect(res.status).toBe(403);
  });

  it('GET /coin/statement — 400 userId inválido', async () => {
    const res = await request(app.getHttpServer())
      .get('/coin/statement')
      .query({ userId: 'not-a-uuid' })
      .set(auth());

    expectClientError(res);
  });

  it('coin-rewards — pending, celebrate idempotente e 401', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);
    await approveChoreWithCoins(app, token, groupId, 4);

    const pending1 = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/coin-rewards/pending`)
      .set(auth())
      .expect(200);

    expect(pending1.body).toEqual(
      expect.objectContaining({
        totalCoins: expect.any(Number),
      }),
    );
    expect(pending1.body.totalCoins).toBeGreaterThan(0);

    const celebrate1 = await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/coin-rewards/celebrate`)
      .set(auth())
      .expect(201);

    expect(celebrate1.body.totalCoins).toBe(pending1.body.totalCoins);

    const pending2 = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/coin-rewards/pending`)
      .set(auth())
      .expect(200);

    expect(pending2.body.totalCoins).toBe(0);

    const celebrate2 = await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/coin-rewards/celebrate`)
      .set(auth())
      .expect(201);

    expect(celebrate2.body.totalCoins).toBe(0);

    await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/coin-rewards/pending`)
      .expect(401);
  });
});
