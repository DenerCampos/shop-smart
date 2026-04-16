import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';

describe('User (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    token = await loginAsSeedUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /user — 201 cria utilizador + resposta em forma de DTO', async () => {
    const email = `e2e-user-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'E2e User',
        email,
        password: 'Valid123',
        family: 'E2e',
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        email,
      }),
    );
    expect(res.body.password).toBeUndefined();
  });

  it('POST /user — 400 validação', async () => {
    const res = await request(app.getHttpServer()).post('/user').send({
      name: '',
      email: 'bad',
      password: '',
    });
    expectClientError(res);
  });

  it('GET /user/:id — 401 sem Bearer', async () => {
    const res = await request(app.getHttpServer()).get(
      '/user/00000000-0000-0000-0000-000000000001',
    );
    expect(res.status).toBe(401);
  });

  it('GET /user/:id — 200 utilizador seed (id via /profile)', async () => {
    const profile = await request(app.getHttpServer())
      .get('/profile')
      .set(bearerAuth(token))
      .expect(200);
    const userId = profile.body.user.id;
    const res = await request(app.getHttpServer())
      .get(`/user/${userId}`)
      .set(bearerAuth(token))
      .expect(200);
    expect(res.body).toEqual(expect.objectContaining({ id: userId }));
  });

  it('PATCH /user/:id — 200 atualiza nome', async () => {
    const profile = await request(app.getHttpServer())
      .get('/profile')
      .set(bearerAuth(token))
      .expect(200);
    const userId = profile.body.user.id;
    const newName = `E2e ${Date.now()}`;
    const res = await request(app.getHttpServer())
      .patch(`/user/${userId}`)
      .set(bearerAuth(token))
      .send({ name: newName })
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ id: userId, name: newName }),
    );
  });
});
