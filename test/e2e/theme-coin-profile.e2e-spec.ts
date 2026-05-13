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

describe('Theme / Coin / Profile (e2e)', () => {
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

  it('GET /theme/available — 200 array', async () => {
    const res = await request(app.getHttpServer())
      .get('/theme/available')
      .set(auth())
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      expect(res.body[0]).toEqual(
        expect.objectContaining({ id: expect.any(String) }),
      );
    }
  });

  it('GET /theme/active — 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/theme/active')
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });

  it('GET /theme/allowed — 200', async () => {
    await request(app.getHttpServer())
      .get('/theme/allowed')
      .set(auth())
      .expect(200);
  });

  it('GET /theme — listagem paginada', async () => {
    const res = await request(app.getHttpServer())
      .get('/theme')
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(res.body);
  });

  it('GET /coin/balance — 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/coin/balance')
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        balance: expect.stringMatching(/^-?\d+(\.\d+)?$/),
      }),
    );
  });

  it('POST /coin/addCoins — 201 (tipo coupon)', async () => {
    const res = await request(app.getHttpServer())
      .post('/coin/addCoins')
      .set(auth())
      .send({ type: 'coupon' })
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });

  it('GET /profile — 200 estrutura ProfileResponseDto', async () => {
    const res = await request(app.getHttpServer())
      .get('/profile')
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
        }),
        income: expect.any(Number),
        expenses: expect.any(Number),
        coins: expect.stringMatching(/^-?\d+(\.\d+)?$/),
        isFirstAccess: expect.any(Boolean),
        hasRecurringRevenues: expect.any(Boolean),
        hasRecurringExpenses: expect.any(Boolean),
      }),
    );
  });

  it('GET /profile/latest-registrations — 200 paginado', async () => {
    const res = await request(app.getHttpServer())
      .get('/profile/latest-registrations')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(res.body);
  });

  it('GET /profile/integrations — 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/profile/integrations')
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(expect.any(Object));
  });

  it('POST /profile/complete-profile — 201 payload válido', async () => {
    await request(app.getHttpServer())
      .post('/profile/complete-profile')
      .set(auth())
      .send({
        name: 'Renda e2e',
        family: 'Família e2e',
        income: 5000,
        date: '2024-01-15T12:00:00.000Z',
        repeatMonthly: true,
      })
      .expect(201);
  });

  it('POST /profile/complete-profile — 201 apenas family', async () => {
    await request(app.getHttpServer())
      .post('/profile/complete-profile')
      .set(auth())
      .send({ family: 'Família só nome e2e' })
      .expect(201);
  });

  it('POST /profile/complete-profile — 400 income sem name', async () => {
    const res = await request(app.getHttpServer())
      .post('/profile/complete-profile')
      .set(auth())
      .send({
        family: 'Família e2e validação',
        income: 100,
        date: '2024-06-01T12:00:00.000Z',
      });
    expectClientError(res);
  });

  it('POST /profile/complete-profile — 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/profile/complete-profile')
      .set(auth())
      .send({ name: '' });
    expectClientError(res);
  });

  it('POST /profile/upload-image — 400 sem ficheiro', async () => {
    const res = await request(app.getHttpServer())
      .post('/profile/upload-image')
      .set(auth());
    expect(res.status).toBe(400);
  });

  it('POST /profile/upload-image — 201 PNG (Google Drive mock)', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const res = await request(app.getHttpServer())
      .post('/profile/upload-image')
      .set(auth())
      .attach('image', png, 'e2e.png')
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        profileImage: expect.any(String),
      }),
    );
  });
});
