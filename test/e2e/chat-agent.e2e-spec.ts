import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bearerAuth, loginAsSeedUser } from './helpers/create-e2e-app';
import { GeminiChatProvider } from '../../src/chat-agent/providers/gemini-chat.provider';
import { ChatAiProviderException } from '../../src/chat-agent/exceptions/chat-agent.exception';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CouponReaderService } from '../../src/coupon-reader/couponReader.service';
import { FILE_STORAGE } from '../../src/file-storage/file-storage.constants';
import {
  mockAudioRecognitionProviders,
  mockCouponReaderService,
  mockFileStorageService,
  mockImageRecognitionProviders,
  mockTextRecognitionProviders,
} from './helpers/external-mocks';
import { configureE2eApp } from '../configure-e2e-app';

describe('ChatAgent (e2e)', () => {
  let app: INestApplication;
  let geminiMock: {
    ask: jest.Mock;
  };

  beforeAll(async () => {
    geminiMock = {
      ask: jest.fn().mockResolvedValue({
        text: 'Você tem 2 despesas este mês.',
        toolTrace: [{ name: 'list_expenses', ok: true }],
      }),
    };

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
      .overrideProvider(GeminiChatProvider)
      .useValue(geminiMock)
      .compile();

    app = moduleFixture.createNestApplication({
      logger: false,
    });
    configureE2eApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria sessão, envia mensagem e lista histórico', async () => {
    const token = await loginAsSeedUser(app);

    const sessionRes = await request(app.getHttpServer())
      .post('/chat-agent/sessions')
      .set(bearerAuth(token))
      .send({ title: 'E2E' })
      .expect(201);

    const sessionId = sessionRes.body.id as string;
    expect(sessionId).toBeTruthy();
    expect(sessionRes.body.userId).toBeTruthy();

    const msgRes = await request(app.getHttpServer())
      .post(`/chat-agent/sessions/${sessionId}/messages`)
      .set(bearerAuth(token))
      .send({
        message: 'Quanto gastei este mês?',
        screenContext: 'despesas',
      })
      .expect(201);

    expect(msgRes.body.assistantMessage.content).toContain('despesas');
    expect(msgRes.body.userMessage.content).toBeTruthy();
    expect(geminiMock.ask).toHaveBeenCalled();

    const history = await request(app.getHttpServer())
      .get(`/chat-agent/sessions/${sessionId}/messages`)
      .query({ page: 1, limit: 20 })
      .set(bearerAuth(token))
      .expect(200);

    expect(history.body.data.length).toBeGreaterThanOrEqual(2);
    expect(history.body.meta).toEqual(
      expect.objectContaining({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: expect.any(Number),
      }),
    );
  });

  it('propaga erro CHAT_AI_PROVIDER_ERROR', async () => {
    const token = await loginAsSeedUser(app);
    geminiMock.ask.mockRejectedValueOnce(new ChatAiProviderException());

    const sessionRes = await request(app.getHttpServer())
      .post('/chat-agent/sessions')
      .set(bearerAuth(token))
      .send({})
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/chat-agent/sessions/${sessionRes.body.id}/messages`)
      .set(bearerAuth(token))
      .send({ message: 'oi' });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('CHAT_AI_PROVIDER_ERROR');
  });

  it('exige autenticação', async () => {
    await request(app.getHttpServer()).get('/chat-agent/sessions').expect(401);
  });

  it('message vazia retorna 400', async () => {
    const token = await loginAsSeedUser(app);

    const sessionRes = await request(app.getHttpServer())
      .post('/chat-agent/sessions')
      .set(bearerAuth(token))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/chat-agent/sessions/${sessionRes.body.id}/messages`)
      .set(bearerAuth(token))
      .send({ message: '' })
      .expect(400);
  });

  it('bloqueia acesso a sessão de outro usuário', async () => {
    const ownerToken = await loginAsSeedUser(app);

    const sessionRes = await request(app.getHttpServer())
      .post('/chat-agent/sessions')
      .set(bearerAuth(ownerToken))
      .send({ title: 'Privada' })
      .expect(201);

    const sessionId = sessionRes.body.id as string;

    const email = `chat-e2e-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'Outro User',
        email,
        password: 'Valid123',
        family: 'Outra',
      })
      .expect(201);

    const otherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Valid123' })
      .expect(200);

    const otherToken = otherLogin.body.accessToken as string;

    await request(app.getHttpServer())
      .get(`/chat-agent/sessions/${sessionId}/messages`)
      .set(bearerAuth(otherToken))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/chat-agent/sessions/${sessionId}/messages`)
      .set(bearerAuth(otherToken))
      .send({ message: 'tentativa indevida' })
      .expect(403);
  });

  it('DELETE sessão retorna 204 e some da listagem', async () => {
    const token = await loginAsSeedUser(app);

    const sessionRes = await request(app.getHttpServer())
      .post('/chat-agent/sessions')
      .set(bearerAuth(token))
      .send({ title: 'Para apagar' })
      .expect(201);

    const sessionId = sessionRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/chat-agent/sessions/${sessionId}`)
      .set(bearerAuth(token))
      .expect(204);

    await request(app.getHttpServer())
      .get(`/chat-agent/sessions/${sessionId}/messages`)
      .set(bearerAuth(token))
      .expect(404);

    const list = await request(app.getHttpServer())
      .get('/chat-agent/sessions')
      .set(bearerAuth(token))
      .expect(200);

    expect(list.body.find((s: { id: string }) => s.id === sessionId)).toBeUndefined();
  });
});
