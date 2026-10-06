import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/create-e2e-app';

describe('Status (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /status — 200 sem autenticação', async () => {
    const res = await request(app.getHttpServer()).get('/status').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
