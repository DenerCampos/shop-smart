import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E completo exige MySQL e env (ver test/E2E-ESTRATEGIA.md).
 * Suite desativada por padrão para não falhar em ambientes sem banco.
 */
describe.skip('AppModule (e2e) — requer API_DB_* e migrações', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exemplo: GET /public ou health quando existir rota', () => {
    return request(app.getHttpServer()).get('/public').expect((res) => {
      expect([200, 301, 302, 404]).toContain(res.status);
    });
  });
});
