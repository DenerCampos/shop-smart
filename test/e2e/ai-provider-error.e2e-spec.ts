import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureE2eApp } from '../configure-e2e-app';
import { CouponReaderService } from '../../src/coupon-reader/couponReader.service';
import { FILE_STORAGE } from '../../src/file-storage/file-storage.constants';
import {
  AI_PROVIDER_ERROR_CODE,
  AI_PROVIDER_ERROR_MESSAGE,
} from '../../src/common/ai-provider/ai-provider.exception';
import {
  failingAudioRecognitionProviders,
  failingImageRecognitionProviders,
  failingTextRecognitionProviders,
  mockCouponReaderService,
  mockFileStorageService,
} from './helpers/external-mocks';
import { bearerAuth, loginAsSeedUser } from './helpers/create-e2e-app';

describe('AI_PROVIDER_ERROR (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider('RECOGNITION_PROVIDERS')
      .useValue(failingImageRecognitionProviders())
      .overrideProvider('TEXT_RECOGNITION_PROVIDERS')
      .useValue(failingTextRecognitionProviders())
      .overrideProvider('AUDIO_RECOGNITION_PROVIDERS')
      .useValue(failingAudioRecognitionProviders())
      .overrideProvider(CouponReaderService)
      .useValue(mockCouponReaderService())
      .overrideProvider(FILE_STORAGE)
      .useValue(mockFileStorageService())
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureE2eApp(app);
    await app.init();
    token = await loginAsSeedUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => bearerAuth(token);

  const expectAiProviderError = (res: { status: number; body: unknown }) => {
    expect(res.status).toBe(502);
    expect(res.body).toEqual(
      expect.objectContaining({
        statusCode: 502,
        error: AI_PROVIDER_ERROR_CODE,
        message: AI_PROVIDER_ERROR_MESSAGE,
      }),
    );
  };

  it('POST /shopping-lists/:id/items com IA — 502 AI_PROVIDER_ERROR', async () => {
    const create = await request(app.getHttpServer())
      .post('/shopping-lists')
      .set(auth())
      .send({ name: `Lista IA e2e ${Date.now()}` })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/shopping-lists/${create.body.id}/items`)
      .set(auth())
      .send({ name: 'leite', useTextRecognition: true });

    expectAiProviderError(res);
  });

  it('POST /expense/analyze-image — 502 AI_PROVIDER_ERROR', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const res = await request(app.getHttpServer())
      .post('/expense/analyze-image')
      .set(auth())
      .attach('image', png, { filename: 'nfe.png', contentType: 'image/png' });

    expectAiProviderError(res);
  });

  it('POST /expense/analyze-audio — 502 AI_PROVIDER_ERROR', async () => {
    const audio = Buffer.alloc(2048, 1);

    const res = await request(app.getHttpServer())
      .post('/expense/analyze-audio')
      .set(auth())
      .attach('audio', audio, {
        filename: 'nota.webm',
        contentType: 'audio/webm',
      });

    expectAiProviderError(res);
  });
});
