import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectPaginatedEnvelope } from './helpers/expect-response';

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
    .send({ name: `E2e chores ${Date.now()}` })
    .expect(201);

  return created.body.id as string;
}

describe('Chore / mesada (e2e)', () => {
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

  it('fluxo admin: definição → start → fotos → submit → approve → payroll → settle + 409 ao liquidar de novo', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    const defRes = await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/definitions`)
      .set(auth())
      .send({
        title: `Lavar louça ${Date.now()}`,
        description: 'Limpar pia',
        rewardValue: 12.5,
        coinReward: 3,
        requirePhoto: true,
        recurrence: 'once',
      })
      .expect(201);

    expect(defRes.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        requirePhoto: true,
      }),
    );

    const openList = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    expectPaginatedEnvelope(openList.body);
    const occId = openList.body.data[0].id as string;
    expect(occId).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/family-groups/${groupId}/chores/occurrences/${occId}/start`)
      .set(auth())
      .expect(200);

    const onePxPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/occurrences/${occId}/photos`)
      .set(auth())
      .attach('before', onePxPng, 'before.png')
      .attach('after', onePxPng, 'after.png')
      .expect(201);

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/occurrences/${occId}/submit`)
      .set(auth())
      .expect(201);

    const pending = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences/pending-approval`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    expectPaginatedEnvelope(pending.body);
    expect(pending.body.data.some((r: { id: string }) => r.id === occId)).toBe(
      true,
    );

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/occurrences/${occId}/approve`)
      .set(auth())
      .expect(201);

    const pendBefore = new Date();
    const periodYm =
      pendBefore.getFullYear() * 100 + (pendBefore.getMonth() + 1);

    const payroll = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/payroll/pending`)
      .query({
        month: pendBefore.getMonth() + 1,
        year: pendBefore.getFullYear(),
      })
      .set(auth())
      .expect(200);

    expect(payroll.body).toEqual(
      expect.objectContaining({
        periodYm,
        members: expect.any(Array),
      }),
    );

    const settle1 = await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/payroll/settle`)
      .set(auth())
      .send({ periodYm })
      .expect(201);

    expect(settle1.body).toEqual(
      expect.objectContaining({ id: expect.any(String), periodYm }),
    );

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/payroll/settle`)
      .set(auth())
      .send({ periodYm })
      .expect(409);
  });

  it('start em ocorrência inexistente — 404', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    await request(app.getHttpServer())
      .patch(
        `/family-groups/${groupId}/chores/occurrences/00000000-0000-0000-0000-000000000099/start`,
      )
      .set(auth())
      .expect(404);
  });

  it('rotas protegidas sem token — 401', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/definitions`)
      .expect(401);
  });
});
