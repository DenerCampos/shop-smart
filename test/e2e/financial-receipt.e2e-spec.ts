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
  name: string,
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
      name,
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

async function inviteAndAccept(
  app: INestApplication,
  adminToken: string,
  groupId: string,
  memberToken: string,
  memberEmail: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post(`/family-group/${groupId}/invite`)
    .set(bearerAuth(adminToken))
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
}

function expectSafeOwnerUser(user: unknown): void {
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
    }),
  );
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('token');
  expect(user).not.toHaveProperty('refreshtoken');
  expect(user).not.toHaveProperty('email');
}

function minimalExpenseBody() {
  return {
    name: `Despesa receipt ${Date.now()}`,
    value: 40,
    repeat: false,
    store: { name: `Loja receipt ${Date.now()}` },
    uri: 'https://example.com/recibo',
    date: '2024-06-10T15:00:00.000Z',
    items: [
      {
        code: '1',
        name: 'Item receipt',
        quantity: 1,
        unit: 'un',
        value: 40,
        total: 40,
        group: { name: 'Alimentação' },
      },
    ],
    payment: { name: 'Dinheiro' },
  };
}

describe('Financial receipt ACL (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let ownerToken: string;
  let peerToken: string;
  let expenseId: string;
  let revenueId: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    adminToken = await loginAsSeedUser(app);

    // E-mails curtos: `user.token` é varchar(255) e o JWT inclui o e-mail.
    const suffix = `${Date.now()}`.slice(-8);
    const ownerEmail = `ro${suffix}@t.local`;
    const peerEmail = `rp${suffix}@t.local`;

    await insertE2eUser(app, ownerEmail, 'Receipt Owner');
    await insertE2eUser(app, peerEmail, 'Receipt Peer');
    ownerToken = await loginE2eUser(app, ownerEmail);
    peerToken = await loginE2eUser(app, peerEmail);

    const groupRes = await request(app.getHttpServer())
      .post('/family-group')
      .set(bearerAuth(adminToken))
      .send({ name: `Receipt ACL ${suffix}` })
      .expect(201);
    const groupId = groupRes.body.id as string;

    await inviteAndAccept(app, adminToken, groupId, ownerToken, ownerEmail);
    await inviteAndAccept(app, adminToken, groupId, peerToken, peerEmail);

    const expenseRes = await request(app.getHttpServer())
      .post('/expense')
      .set(bearerAuth(ownerToken))
      .send(minimalExpenseBody())
      .expect(201);
    expenseId = expenseRes.body.id as string;

    const revenueRes = await request(app.getHttpServer())
      .post('/revenue')
      .set(bearerAuth(ownerToken))
      .send({
        name: `Receita receipt ${suffix}`,
        value: 300,
        repeat: false,
        date: '2024-06-11T12:00:00.000Z',
      })
      .expect(201);
    revenueId = revenueRes.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /expense/:id/receipt', () => {
    it('dono visualiza o próprio comprovante sem PII de User', async () => {
      const res = await request(app.getHttpServer())
        .get(`/expense/${expenseId}/receipt`)
        .set(bearerAuth(ownerToken))
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: expenseId,
          type: 'expense',
        }),
      );
      expectSafeOwnerUser(res.body.user);
    });

    it('admin da família visualiza comprovante do membro sem PII de User', async () => {
      const res = await request(app.getHttpServer())
        .get(`/expense/${expenseId}/receipt`)
        .set(bearerAuth(adminToken))
        .expect(200);

      expect(res.body.id).toBe(expenseId);
      expectSafeOwnerUser(res.body.user);
    });

    it('membro comum não visualiza comprovante alheio', async () => {
      await request(app.getHttpServer())
        .get(`/expense/${expenseId}/receipt`)
        .set(bearerAuth(peerToken))
        .expect(403);
    });

    it('sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .get(`/expense/${expenseId}/receipt`)
        .expect(401);
    });

    it('id inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/expense/${randomUUID()}/receipt`)
        .set(bearerAuth(ownerToken))
        .expect(404);
    });
  });

  describe('GET /revenue/:id/receipt', () => {
    it('dono visualiza o próprio comprovante sem PII de User', async () => {
      const res = await request(app.getHttpServer())
        .get(`/revenue/${revenueId}/receipt`)
        .set(bearerAuth(ownerToken))
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: revenueId,
          type: 'revenue',
        }),
      );
      expectSafeOwnerUser(res.body.user);
    });

    it('admin da família visualiza comprovante do membro sem PII de User', async () => {
      const res = await request(app.getHttpServer())
        .get(`/revenue/${revenueId}/receipt`)
        .set(bearerAuth(adminToken))
        .expect(200);

      expect(res.body.id).toBe(revenueId);
      expectSafeOwnerUser(res.body.user);
    });

    it('membro comum não visualiza comprovante alheio', async () => {
      await request(app.getHttpServer())
        .get(`/revenue/${revenueId}/receipt`)
        .set(bearerAuth(peerToken))
        .expect(403);
    });
  });
});
