import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError, expectPaginatedEnvelope } from './helpers/expect-response';

describe('Group / Store / Payment (e2e)', () => {
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

  it('Group — CRUD + listagem paginada', async () => {
    const create = await request(app.getHttpServer())
      .post('/group')
      .set(auth())
      .send({ name: `E2e group ${Date.now()}` })
      .expect(201);
    expect(create.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
    const id = create.body.id;

    const list = await request(app.getHttpServer())
      .get('/group')
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(list.body);
    expect(list.body.data.some((g: { id: string }) => g.id === id)).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/group/${id}`)
      .set(auth())
      .expect(200);
    expect(one.body.id).toBe(id);

    const upd = await request(app.getHttpServer())
      .patch(`/group/${id}`)
      .set(auth())
      .send({ name: 'E2e group updated' })
      .expect(200);
    expect(upd.body.name).toBe('E2e group updated');

    const del = await request(app.getHttpServer())
      .delete(`/group/${id}`)
      .set(auth())
      .expect(200);
    expect(del.body).toEqual({ deleted: true });
  });

  it('Group — 401 sem token', async () => {
    const res = await request(app.getHttpServer()).get('/group');
    expect(res.status).toBe(401);
  });

  it('Group — 400 create body inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/group')
      .set(auth())
      .send({ name: 123 });
    expectClientError(res);
  });

  it('Store — CRUD', async () => {
    const create = await request(app.getHttpServer())
      .post('/store')
      .set(auth())
      .send({ name: `E2e store ${Date.now()}` })
      .expect(201);
    const id = create.body.id;

    await request(app.getHttpServer())
      .get('/store')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .get(`/store/${id}`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/store/${id}`)
      .set(auth())
      .send({ name: 'E2e store up' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/store/${id}`)
      .set(auth())
      .expect(200);
  });

  it('Payment — CRUD', async () => {
    const create = await request(app.getHttpServer())
      .post('/payment')
      .set(auth())
      .send({ name: `E2e pay ${Date.now()}` })
      .expect(201);
    const id = create.body.id;

    await request(app.getHttpServer())
      .get('/payment')
      .query({ page: 1, limit: 5 })
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .get(`/payment/${id}`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/payment/${id}`)
      .set(auth())
      .send({ name: 'E2e pay up' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/payment/${id}`)
      .set(auth())
      .expect(200);
  });
});
