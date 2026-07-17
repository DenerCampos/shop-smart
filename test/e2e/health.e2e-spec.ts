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

async function insertUser(
  app: INestApplication,
  email: string,
): Promise<string> {
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

async function insertOverview(
  app: INestApplication,
  userId: string,
  reportContent: string,
): Promise<string> {
  const ds = app.get(DataSource);
  const id = randomUUID();
  await ds.query(
    `INSERT INTO \`health_ai_overview\`
      (\`id\`, \`reportContent\`, \`generatedAt\`, \`createdAt\`, \`familyGroupId\`, \`userId\`, \`generatedByUserId\`)
     VALUES (?, ?, NOW(), NOW(6), NULL, ?, ?)`,
    [id, reportContent, userId, userId],
  );
  return id;
}

describe('Health (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let userBId: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    tokenA = await loginAsSeedUser(app);
    const suffix = Date.now().toString(36);
    const emailB = `heb${suffix}@t.local`;
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

  // ─── patient-context ──────────────────────────────────────────────────────

  it('POST /health/patient-context exige autenticação', async () => {
    await request(app.getHttpServer())
      .post('/health/patient-context')
      .send({ content: 'Sem token' })
      .expect(401);
  });

  it('POST /health/patient-context com conteúdo vazio retorna 400', async () => {
    await request(app.getHttpServer())
      .post('/health/patient-context')
      .set(bearerAuth(tokenB))
      .send({ content: '' })
      .expect(400);
  });

  it('POST /health/patient-context cria descrição e GET /latest retorna a mais recente', async () => {
    const create = await request(app.getHttpServer())
      .post('/health/patient-context')
      .set(bearerAuth(tokenB))
      .send({ content: 'Com dor de cabeça hoje' })
      .expect(201);

    expect(create.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        content: 'Com dor de cabeça hoje',
      }),
    );

    const latest = await request(app.getHttpServer())
      .get('/health/patient-context/latest')
      .set(bearerAuth(tokenB))
      .expect(200);

    expect(latest.body).toEqual(
      expect.objectContaining({ content: 'Com dor de cabeça hoje' }),
    );
  });

  // ─── ai-overview (listagem e consulta) ────────────────────────────────────

  it('GET /health/ai-overview exige autenticação', async () => {
    await request(app.getHttpServer()).get('/health/ai-overview').expect(401);
  });

  it('GET /health/ai-overview retorna array', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/ai-overview')
      .set(bearerAuth(tokenA))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /health/ai-overview com data inválida retorna 400', async () => {
    await request(app.getHttpServer())
      .get('/health/ai-overview')
      .query({ startDate: 'ontem' })
      .set(bearerAuth(tokenA))
      .expect(400);
  });

  it('GET /health/ai-overview/:id inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .get(`/health/ai-overview/${randomUUID()}`)
      .set(bearerAuth(tokenA))
      .expect(404);
  });

  it('GET /health/ai-overview/:id retorna o relatório do próprio usuário', async () => {
    const overviewId = await insertOverview(
      app,
      userBId,
      'Relatório de saúde E2E do usuário B',
    );

    const res = await request(app.getHttpServer())
      .get(`/health/ai-overview/${overviewId}`)
      .set(bearerAuth(tokenB))
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: overviewId,
        reportContent: 'Relatório de saúde E2E do usuário B',
      }),
    );
  });

  it('GET /health/ai-overview/:id bloqueia acesso a relatório de outro usuário sem grupo', async () => {
    const overviewId = await insertOverview(
      app,
      userBId,
      'Relatório privado do usuário B',
    );

    await request(app.getHttpServer())
      .get(`/health/ai-overview/${overviewId}`)
      .set(bearerAuth(tokenA))
      .expect(403);
  });

  // ─── exam-items (evolução laboratorial — SP-124) ─────────────────────────

  it('GET /health/exam-items/names exige autenticação', async () => {
    await request(app.getHttpServer())
      .get('/health/exam-items/names')
      .expect(401);
  });

  it('GET /health/exam-items/names lista itens do próprio usuário e filtra por search', async () => {
    await request(app.getHttpServer())
      .post('/health/exams')
      .set(bearerAuth(tokenB))
      .send({
        examType: 'LABORATORY',
        labName: 'Lab Evolução',
        examDate: '2026-01-15',
        items: [
          {
            itemName: 'PLAQUETAS',
            resultValue: '250000',
            resultUnit: '/mm3',
            isAbnormal: false,
          },
          {
            itemName: 'glicose',
            resultValue: '95',
            resultUnit: 'mg/dL',
            isAbnormal: false,
          },
        ],
      })
      .expect(201);

    const names = await request(app.getHttpServer())
      .get('/health/exam-items/names')
      .set(bearerAuth(tokenB))
      .expect(200);

    expect(Array.isArray(names.body)).toBe(true);
    expect(names.body).toEqual(
      expect.arrayContaining(['Plaquetas', 'Glicose']),
    );

    const filtered = await request(app.getHttpServer())
      .get('/health/exam-items/names')
      .query({ search: 'plaq' })
      .set(bearerAuth(tokenB))
      .expect(200);

    expect(filtered.body).toEqual(expect.arrayContaining(['Plaquetas']));
    expect(filtered.body).not.toContain('Glicose');
  });

  it('GET /health/exam-items/names?userId= bloqueia outro usuário sem grupo', async () => {
    await request(app.getHttpServer())
      .get('/health/exam-items/names')
      .query({ userId: userBId })
      .set(bearerAuth(tokenA))
      .expect(403);
  });

  it('GET /health/exam-items/evolution exige autenticação', async () => {
    await request(app.getHttpServer())
      .get('/health/exam-items/evolution')
      .query({ itemName: 'Plaquetas' })
      .expect(401);
  });

  it('GET /health/exam-items/evolution sem itemName retorna 400', async () => {
    await request(app.getHttpServer())
      .get('/health/exam-items/evolution')
      .set(bearerAuth(tokenB))
      .expect(400);
  });

  it('GET /health/exam-items/evolution retorna série ASC do próprio usuário', async () => {
    await request(app.getHttpServer())
      .post('/health/exams')
      .set(bearerAuth(tokenB))
      .send({
        examType: 'LABORATORY',
        labName: 'Lab Evolução 2',
        examDate: '2026-03-01',
        items: [
          {
            itemName: 'Hemoglobina',
            resultValue: '13.5',
            resultUnit: 'g/dL',
            referenceRange: '12-16',
            isAbnormal: false,
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/health/exams')
      .set(bearerAuth(tokenB))
      .send({
        examType: 'LABORATORY',
        labName: 'Lab Evolução 2',
        examDate: '2026-02-01',
        items: [
          {
            itemName: 'HEMOGLOBINA',
            resultValue: '12.8',
            resultUnit: 'g/dL',
            referenceRange: '12-16',
            isAbnormal: false,
          },
        ],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/health/exam-items/evolution')
      .query({
        itemName: 'Hemoglobina',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      })
      .set(bearerAuth(tokenB))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        examId: expect.any(String),
        examDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        resultValue: expect.any(String),
        isAbnormal: expect.any(Boolean),
      }),
    );

    const dates = res.body.map((p: { examDate: string }) => p.examDate);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('GET /health/exam-items/evolution?userId= bloqueia outro usuário sem grupo', async () => {
    await request(app.getHttpServer())
      .get('/health/exam-items/evolution')
      .query({ itemName: 'Plaquetas', userId: userBId })
      .set(bearerAuth(tokenA))
      .expect(403);
  });
});
