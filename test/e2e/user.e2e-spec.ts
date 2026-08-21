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

  describe('GET /user/search', () => {
    it('401 sem Bearer', async () => {
      const res = await request(app.getHttpServer()).get('/user/search').query({
        email: 'tes',
      });
      expect(res.status).toBe(401);
    });

    it('400 quando email tem menos de 3 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .get('/user/search')
        .query({ email: 'ab' })
        .set(bearerAuth(token));
      expectClientError(res);
    });

    it('403 quando usuário não é admin de nenhum grupo', async () => {
      const email = `e2e-member-${Date.now()}@example.com`;
      const password = 'Valid123';
      await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'E2e Member',
          email,
          password,
          family: 'Solo',
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/user/search')
        .query({ email: 'tes' })
        .set(bearerAuth(login.body.accessToken));

      expect(res.status).toBe(403);
    });

    it('200 quando admin busca por prefixo de email', async () => {
      await request(app.getHttpServer())
        .post('/family-group')
        .set(bearerAuth(token))
        .send({ name: `Família search e2e ${Date.now()}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/user/search')
        .query({ email: 'tes' })
        .set(bearerAuth(token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
      );
      expect(res.body[0].password).toBeUndefined();
    });
  });

  describe('validação e unicidade de e-mail (SP-39)', () => {
    it('POST /user — 400 senha com menos de 8 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Short Pass',
          email: `short-pass-${Date.now()}@example.com`,
          password: '1234567',
        });
      expectClientError(res);
    });

    it('POST /user — 400 nome com menos de 3 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Ab',
          email: `short-name-${Date.now()}@example.com`,
          password: 'Valid123',
        });
      expectClientError(res);
    });

    it('POST /user — 409 EMAIL_ALREADY_EXISTS para e-mail duplicado', async () => {
      const email = `dup-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'First User',
          email,
          password: 'Valid123',
        })
        .expect(201);

      const res = await request(app.getHttpServer()).post('/user').send({
        name: 'Second User',
        email: email.toUpperCase(),
        password: 'Valid123',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'EMAIL_ALREADY_EXISTS',
        }),
      );
    });

    it('POST /user — 409 ACCOUNT_DELETED_REACTIVATION_REQUIRED quando e-mail está soft-deleted', async () => {
      const email = `deleted-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'To Delete',
          email,
          password,
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .send({ password })
        .expect(200);

      const res = await request(app.getHttpServer()).post('/user').send({
        name: 'Reactivate Candidate',
        email,
        password: 'Another12',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'ACCOUNT_DELETED_REACTIVATION_REQUIRED',
        }),
      );
    });
  });

  describe('DELETE /user/:id (SP-136)', () => {
    it('200 com senha correta e invalida o JWT anterior', async () => {
      const email = `delete-ok-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Delete Ok', email, password })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .send({ password })
        .expect(200);

      await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(401);
    });

    it('400 INVALID_PASSWORD com senha incorreta', async () => {
      const email = `delete-bad-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Delete Bad', email, password })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .send({ password: 'WrongPass1' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_PASSWORD');
    });

    it('409 FAMILY_GROUP_OWNER quando é o criador do grupo', async () => {
      const email = `delete-admin-${Date.now()}@example.com`;
      const password = 'Valid123';

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'Delete Admin', email, password })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const profile = await request(app.getHttpServer())
        .get('/profile')
        .set(bearerAuth(login.body.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .post('/family-group')
        .set(bearerAuth(login.body.accessToken))
        .send({ name: `Família delete e2e ${Date.now()}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/user/${profile.body.user.id}`)
        .set(bearerAuth(login.body.accessToken))
        .send({ password });

      expect(res.status).toBe(409);
      expect(res.body).toEqual(
        expect.objectContaining({
          code: 'FAMILY_GROUP_OWNER',
        }),
      );
    });
  });
});
