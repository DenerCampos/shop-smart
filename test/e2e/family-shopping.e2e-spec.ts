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

describe('Family group / Shopping lists (e2e)', () => {
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

  it('POST /family-group — 201 + GET lista', async () => {
    const create = await request(app.getHttpServer())
      .post('/family-group')
      .set(auth())
      .send({ name: `Família e2e ${Date.now()}` })
      .expect(201);
    expect(create.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );

    const list = await request(app.getHttpServer())
      .get('/family-group')
      .set(auth())
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it('POST /family-group — 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/family-group')
      .set(auth())
      .send({ name: '' });
    expectClientError(res);
  });

  it('Shopping lists — CRUD mínimo', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista e2e ${Date.now()}` })
      .expect(201);
    const id = create.body.id;
    expect(id).toBeDefined();

    const list = await request(app.getHttpServer())
      .get('/shopping-lists')
      .query({ page: 1, limit: 10 })
      .set(auth())
      .expect(200);
    expectPaginatedEnvelope(list.body);

    const one = await request(app.getHttpServer())
      .get(`/shopping-lists/${id}`)
      .set(auth())
      .expect(200);
    expect(one.body).toEqual(
      expect.objectContaining({ id, name: expect.any(String) }),
    );

    await request(app.getHttpServer())
      .patch(`/shopping-lists/${id}`)
      .set(auth())
      .send({ name: 'Lista e2e atualizada' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/shopping-lists/${id}`)
      .set(auth())
      .expect(200);
  });

  it('GET /shopping-lists/suggestions — 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/shopping-lists/suggestions')
      .query({ search: 'le' })
      .set(auth())
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /shopping-lists/suggestions — 400 search curto', async () => {
    const res = await request(app.getHttpServer())
      .get('/shopping-lists/suggestions')
      .query({ search: 'x' })
      .set(auth());
    expectClientError(res);
  });

  it('POST /shopping-lists/:listId/items/bulk — 201 vários itens', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista bulk e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    const bulk = await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/items/bulk`)
      .set(auth())
      .send({ text: 'feijão, arroz' })
      .expect(201);

    expect(Array.isArray(bulk.body)).toBe(true);
    expect(bulk.body.length).toBe(2);
    expect(bulk.body[0]).toEqual(
      expect.objectContaining({ name: expect.any(String) }),
    );
  });

  it('POST /shopping-lists/:listId/items/bulk — 404 lista inexistente', async () => {
    const res = await request(app.getHttpServer())
      .post(`/shopping-lists/00000000-0000-4000-8000-000000000099/items/bulk`)
      .set(auth())
      .send({ text: 'item único' });
    expect(res.status).toBe(404);
  });

  it('POST /shopping-lists/:listId/items/bulk — 401 sem token', async () => {
    await request(app.getHttpServer())
      .post(`/shopping-lists/00000000-0000-4000-8000-000000000099/items/bulk`)
      .send({ text: 'x' })
      .expect(401);
  });

  it('PATCH /shopping-lists/:id/complete — 400 em lista já finalizada', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista complete e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    await request(app.getHttpServer())
      .patch(`/shopping-lists/${listId}/complete`)
      .set(auth())
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`/shopping-lists/${listId}/complete`)
      .set(auth());
    expectClientError(res);
    expect(res.status).toBe(400);
  });

  it('PATCH /shopping-lists/:id/complete-with-remaining — finaliza e cria nova lista', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista partial e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    const bulk = await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/items/bulk`)
      .set(auth())
      .send({ text: 'feijão, arroz, leite' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/shopping-lists/items/${bulk.body[0].id}/toggle`)
      .set(auth())
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`/shopping-lists/${listId}/complete-with-remaining`)
      .set(auth())
      .expect(200);

    expect(res.body.completed).toEqual(
      expect.objectContaining({
        id: listId,
        status: 'completed',
      }),
    );
    expect(res.body.newList).toEqual(
      expect.objectContaining({
        status: 'active',
        pendingCount: 2,
        itemsCount: 2,
      }),
    );
    expect(res.body.newList.id).not.toBe(listId);
  });

  it('PATCH /shopping-lists/:id/complete-with-remaining — 400 sem itens in_cart', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista partial err e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/items/bulk`)
      .set(auth())
      .send({ text: 'feijão, arroz' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/shopping-lists/${listId}/complete-with-remaining`)
      .set(auth());
    expectClientError(res);
    expect(res.status).toBe(400);
  });

  it('POST /shopping-lists/:id/recreate — nova lista ativa a partir de finalizada', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista recreate e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/items/bulk`)
      .set(auth())
      .send({ text: 'feijão, arroz' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/shopping-lists/${listId}/complete`)
      .set(auth())
      .expect(200);

    const recreated = await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/recreate`)
      .set(auth())
      .expect(201);

    expect(recreated.body).toEqual(
      expect.objectContaining({
        status: 'active',
        itemsCount: 2,
        pendingCount: 2,
      }),
    );
    expect(recreated.body.id).not.toBe(listId);
  });

  it('POST /shopping-lists/:id/recreate — 400 em lista active', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista recreate err e2e ${Date.now()}` })
      .expect(201);
    const listId = create.body.id as string;

    const res = await request(app.getHttpServer())
      .post(`/shopping-lists/${listId}/recreate`)
      .set(auth());
    expectClientError(res);
    expect(res.status).toBe(400);
  });
});
