import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';

describe('Recognition quota / Coupon reader (e2e)', () => {
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

  it.each([
    ['/image-recognition/quota'],
    ['/text-recognition/quota'],
    ['/audio-recognition/quota'],
  ])('%s — 200 QuotaResponseDto', async (path) => {
    const res = await request(app.getHttpServer())
      .get(path)
      .set(auth())
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        provider: expect.any(String),
        requestCount: expect.any(Number),
        dailyLimit: expect.any(Number),
        remaining: expect.any(Number),
      }),
    );
  });

  it('POST /coupon-reader — 200 (sem HTTP externo; serviço mock)', async () => {
    const res = await request(app.getHttpServer())
      .post('/coupon-reader')
      .set(auth())
      .send({ url: 'https://example.com/nota-fiscal' })
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        value: expect.any(Number),
        uri: expect.any(String),
      }),
    );
  });

  it('POST /coupon-reader — 400 URL inválida', async () => {
    const res = await request(app.getHttpServer())
      .post('/coupon-reader')
      .set(auth())
      .send({ url: 'not-a-url' });
    expectClientError(res);
  });
});
