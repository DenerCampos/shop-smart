import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { configureE2eApp } from '../../configure-e2e-app';
import { CouponReaderService } from '../../../src/coupon-reader/couponReader.service';
import { FILE_STORAGE } from '../../../src/file-storage/file-storage.constants';
import {
  mockAudioRecognitionProviders,
  mockCouponReaderService,
  mockFileStorageService,
  mockImageRecognitionProviders,
  mockTextRecognitionProviders,
} from './external-mocks';

/** Credenciais do seed de desenvolvimento (`db/seeds/user.dev.seed.ts`). */
export const E2E_SEED_EMAIL = 'teste@dev.local';
export const E2E_SEED_PASSWORD = 'Valid123';

/**
 * `AppModule` completo + MySQL (`shop_smart_test`) + mocks de fronteiras externas
 * (Gemini-shaped providers, coupon HTTP, file storage). Ver `external-mocks.ts`.
 */
export async function createE2eApplication(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
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

  const app = moduleFixture.createNestApplication({
    logger: process.env.E2E_DEBUG === '1' ? ['error', 'warn', 'log'] : false,
  });
  configureE2eApp(app);
  await app.init();
  return app;
}

export async function loginAsSeedUser(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: E2E_SEED_EMAIL, password: E2E_SEED_PASSWORD })
    .expect(200);

  expect(res.body).toEqual(
    expect.objectContaining({ accessToken: expect.any(String) }),
  );
  return res.body.accessToken as string;
}

export function bearerAuth(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}
