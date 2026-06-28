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

const VALID_PASSWORD = 'Valid123';

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: VALID_PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}

async function insertUser(app: INestApplication, email: string): Promise<string> {
  const ds = app.get(DataSource);
  const existing = await ds.query(
    'SELECT `id` FROM `user` WHERE `email` = ? LIMIT 1',
    [email],
  );
  if (existing?.length) {
    return existing[0].id as string;
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);

  await ds.query(
    `INSERT INTO \`user\`
      (\`id\`, \`name\`, \`email\`, \`family\`, \`coatOfArms\`, \`password\`, \`token\`, \`refreshtoken\`, \`profileImage\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(6), NOW(6), NULL)`,
    [
      userId,
      'e2e health user',
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

  return userId;
}

describe('Health (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let userBId: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    tokenA = await loginAsSeedUser(app);
    const suffix = Date.now();
    const emailB = `health-e2e-outsider-${suffix}@local.test`;
    userBId = await insertUser(app, emailB);
    tokenB = await login(app, emailB);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/exams exige autenticação', async () => {
    await request(app.getHttpServer()).get('/health/exams').expect(401);
  });

  it('POST /health/exams cadastra exame manual e GET retorna paginado', async () => {
    const create = await request(app.getHttpServer())
      .post('/health/exams')
      .set(bearerAuth(tokenA))
      .send({
        examType: 'LABORATORY',
        labName: 'Lab E2E',
        examDate: '2026-06-01',
        items: [
          {
            itemName: 'Glicose',
            resultValue: '90',
            resultUnit: 'mg/dL',
            referenceRange: '70-99',
            isAbnormal: false,
          },
        ],
      })
      .expect(201);

    expect(create.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        examType: 'LABORATORY',
        status: 'APPROVED',
      }),
    );

    const list = await request(app.getHttpServer())
      .get('/health/exams')
      .query({ page: 1, limit: 10 })
      .set(bearerAuth(tokenA))
      .expect(200);

    expectPaginatedEnvelope(list.body);
  });

  it('GET /health/exams?userId= bloqueia acesso a exames de outro usuário sem grupo', async () => {
    await request(app.getHttpServer())
      .get('/health/exams')
      .query({ userId: userBId, page: 1, limit: 10 })
      .set(bearerAuth(tokenA))
      .expect(403);
  });

  it('POST /health/upload sem arquivos retorna 400', async () => {
    await request(app.getHttpServer())
      .post('/health/upload')
      .set(bearerAuth(tokenA))
      .expect(400);
  });

  it('POST /health/prescriptions cria receituário', async () => {
    const res = await request(app.getHttpServer())
      .post('/health/prescriptions')
      .set(bearerAuth(tokenB))
      .send({
        doctorName: 'Dr. E2E',
        prescriptionDate: '2026-06-01',
        items: [
          {
            medicationName: 'Paracetamol',
            dosage: '500mg',
            scheduleTimes: ['08:00'],
          },
        ],
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        doctorName: 'Dr. E2E',
        items: expect.any(Array),
      }),
    );
  });

  it('GET /health/processing retorna lista (todos os status)', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/processing')
      .set(bearerAuth(tokenA))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
