import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureE2eApp } from './configure-e2e-app';
import { CouponReaderService } from '../src/coupon-reader/couponReader.service';
import { FILE_STORAGE } from '../src/file-storage/file-storage.constants';
import {
  mockAudioRecognitionProviders,
  mockCouponReaderService,
  mockFileStorageService,
  mockImageRecognitionProviders,
  mockTextRecognitionProviders,
} from './e2e/helpers/external-mocks';

/**
 * Smoke + alinhamento ao grafo E2E (mesmos overrides que `createE2eApplication`).
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider('RECOGNITION_PROVIDERS')
      .useValue(mockImageRecognitionProviders)
      .overrideProvider('TEXT_RECOGNITION_PROVIDERS')
      .useValue(mockTextRecognitionProviders)
      .overrideProvider('AUDIO_RECOGNITION_PROVIDERS')
      .useValue(mockAudioRecognitionProviders)
      .overrideProvider(CouponReaderService)
      .useValue(mockCouponReaderService())
      .overrideProvider(FILE_STORAGE)
      .useValue(mockFileStorageService())
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureE2eApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /public — estático ou 404 conforme public/', () => {
    return request(app.getHttpServer())
      .get('/public')
      .expect((res) => {
        expect([200, 301, 302, 404]).toContain(res.status);
      });
  });
});
