import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError, expectPaginatedEnvelope } from './helpers/expect-response';

function minimalExpenseBody() {
  return {
    name: `Despesa e2e ${Date.now()}`,
    value: 50,
    repeat: false,
    store: { name: `Loja e2e ${Date.now()}` },
    uri: 'https://example.com/recibo',
    date: '2024-06-10T15:00:00.000Z',
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
  };
}

describe('Expense / Revenue / Reports (e2e)', () => {
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

  it('POST /expense — 201 + ExpenseResponseDto', async () => {
    const res = await request(app.getHttpServer())
      .post('/expense')
      .set(auth())
      .send(minimalExpenseBody())
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        value: expect.stringMatching(/^-?\d+(\.\d+)?$/),
      }),
    );
  });

  it('POST /expense — 400 payload inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/expense')
      .set(auth())
      .send({ name: 'x' });
    expectClientError(res);
  });

  it('GET /expense — listagem paginada', async () => {
    const res = await request(app.getHttpServer())
      .get('/expense')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(res.body);
  });

  it('GET /expense/current-month — 200 array', async () => {
    const res = await request(app.getHttpServer())
      .get('/expense/current-month')
      .set(auth())
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /expense/value-current-month — 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/expense/value-current-month')
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ value: expect.any(Number) }),
    );
  });

  it('POST /revenue — 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/revenue')
      .set(auth())
      .send({
        name: `Receita e2e ${Date.now()}`,
        value: 200,
        repeat: false,
        date: '2024-06-11T12:00:00.000Z',
      })
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
  });

  it('GET /revenue — listagem paginada', async () => {
    const res = await request(app.getHttpServer())
      .get('/revenue')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(res.body);
  });

  it('GET /reports/* — 200 relatórios', async () => {
    const endpoints = [
      '/reports/expense-by-group',
      '/reports/expense-by-store',
      '/reports/expense-by-date',
      '/reports/most-purchased-items',
      '/reports/expenses-income-comparison',
    ];
    for (const path of endpoints) {
      const res = await request(app.getHttpServer())
        .get(path)
        .set(auth())
        .expect(200);
      expect(res.body).toBeDefined();
    }
  });
});
