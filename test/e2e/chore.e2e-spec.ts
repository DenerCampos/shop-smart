import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectPaginatedEnvelope } from './helpers/expect-response';

const E2E_USER_PASSWORD = 'Valid123';

async function loginE2eUser(
  app: INestApplication,
  email: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: E2E_USER_PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}

async function insertE2eUser(
  app: INestApplication,
  email: string,
): Promise<void> {
  const ds = app.get(DataSource);
  const existing = await ds.query(
    'SELECT `id` FROM `user` WHERE `email` = ? LIMIT 1',
    [email],
  );
  if (existing?.length) {
    return;
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(E2E_USER_PASSWORD, 10);

  await ds.query(
    `INSERT INTO \`user\`
      (\`id\`, \`name\`, \`email\`, \`family\`, \`coatOfArms\`, \`password\`, \`token\`, \`refreshtoken\`, \`profileImage\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(6), NOW(6), NULL)`,
    [
      userId,
      'e2e chore user',
      email,
      'e2e',
      '/assets/images/brasao/brasao-1.png',
      passwordHash,
    ],
  );

  await ds.query(
    `INSERT INTO \`coin\`
      (\`id\`, \`balance\`, \`totalEarned\`, \`totalSpent\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`, \`userId\`)
     VALUES (?, 0, 0, 0, NOW(6), NOW(6), NULL, ?)`,
    [randomUUID(), userId],
  );
}

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

  it('return-for-adjustment — devolve ocorrência para IN_PROGRESS com mesmo executor', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    const defRes = await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/definitions`)
      .set(auth())
      .send({
        title: `Ajuste ${Date.now()}`,
        description: 'Teste devolução',
        rewardValue: 8,
        coinReward: 1,
        requirePhoto: false,
        recurrence: 'once',
      })
      .expect(201);

    expect(defRes.body.id).toBeDefined();

    const openList = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    const occId = openList.body.data[0].id as string;

    await request(app.getHttpServer())
      .patch(`/family-groups/${groupId}/chores/occurrences/${occId}/start`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/occurrences/${occId}/submit`)
      .set(auth())
      .expect(201);

    const returned = await request(app.getHttpServer())
      .post(
        `/family-groups/${groupId}/chores/occurrences/${occId}/return-for-adjustment`,
      )
      .set(auth())
      .expect(201);

    expect(returned.body).toEqual(
      expect.objectContaining({
        id: occId,
        status: 'IN_PROGRESS',
        assignedTo: expect.objectContaining({ id: expect.any(String) }),
      }),
    );

    const pending = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences/pending-approval`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    expect(pending.body.data.some((r: { id: string }) => r.id === occId)).toBe(
      false,
    );

    const mine = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences/mine`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    expect(mine.body.data.some((r: { id: string; status: string }) => r.id === occId && r.status === 'IN_PROGRESS')).toBe(
      true,
    );
  });

  it('return-for-adjustment em ocorrência inexistente — 404', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    await request(app.getHttpServer())
      .post(
        `/family-groups/${groupId}/chores/occurrences/00000000-0000-0000-0000-000000000099/return-for-adjustment`,
      )
      .set(auth())
      .expect(404);
  });

  it('return-for-adjustment fora de WAITING_APPROVAL — 404', async () => {
    const groupId = await getOrCreateFamilyGroupId(app, token);

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/definitions`)
      .set(auth())
      .send({
        title: `Sem submit ${Date.now()}`,
        description: 'Ainda em execução',
        rewardValue: 5,
        coinReward: 1,
        requirePhoto: false,
        recurrence: 'once',
      })
      .expect(201);

    const openList = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    const occId = openList.body.data[0].id as string;

    await request(app.getHttpServer())
      .patch(`/family-groups/${groupId}/chores/occurrences/${occId}/start`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .post(
        `/family-groups/${groupId}/chores/occurrences/${occId}/return-for-adjustment`,
      )
      .set(auth())
      .expect(404);
  });

  it('return-for-adjustment — 403 para membro não-admin', async () => {
    const suffix = Date.now();
    const memberEmail = `chore-e2e-member-${suffix}@local.test`;
    await insertE2eUser(app, memberEmail);
    const memberToken = await loginE2eUser(app, memberEmail);

    const groupRes = await request(app.getHttpServer())
      .post('/family-group')
      .set(auth())
      .send({ name: `Chore return 403 ${suffix}` })
      .expect(201);
    const groupId = groupRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/family-group/${groupId}/invite`)
      .set(auth())
      .send({ email: memberEmail })
      .expect(201);

    const invitations = await request(app.getHttpServer())
      .get('/family-group/invitations')
      .set(bearerAuth(memberToken))
      .expect(200);

    await request(app.getHttpServer())
      .patch(
        `/family-group/invitations/${invitations.body[0].id as string}/accept`,
      )
      .set(bearerAuth(memberToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/definitions`)
      .set(auth())
      .send({
        title: `Admin only return ${suffix}`,
        description: 'Membro não pode devolver',
        rewardValue: 6,
        coinReward: 1,
        requirePhoto: false,
        recurrence: 'once',
      })
      .expect(201);

    const openList = await request(app.getHttpServer())
      .get(`/family-groups/${groupId}/chores/occurrences`)
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);

    const occId = openList.body.data[0].id as string;

    await request(app.getHttpServer())
      .patch(`/family-groups/${groupId}/chores/occurrences/${occId}/start`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .post(`/family-groups/${groupId}/chores/occurrences/${occId}/submit`)
      .set(auth())
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/family-groups/${groupId}/chores/occurrences/${occId}/return-for-adjustment`,
      )
      .set(bearerAuth(memberToken))
      .expect(403);
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
