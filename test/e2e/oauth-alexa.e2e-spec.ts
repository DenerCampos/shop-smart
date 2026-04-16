import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AuthService } from '../../src/auth/auth.service';
import {
  createE2eApplication,
  E2E_SEED_EMAIL,
  E2E_SEED_PASSWORD,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectClientError } from './helpers/expect-response';

const ALLOWED_ALEXA_REDIRECT =
  'https://layla.amazon.com/api/skill/link/MS4WVQL7EX52W';

describe('OAuth / Alexa (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/oauth/authorize — 400 response_type inválido', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/oauth/authorize')
      .query({
        client_id: 'alexa-skill',
        response_type: 'token',
        redirect_uri: ALLOWED_ALEXA_REDIRECT,
      });
    expect(res.status).toBe(400);
  });

  it('GET /auth/oauth/authorize — 302 + session_code (fluxo real, sem IdP externo)', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/oauth/authorize')
      .query({
        client_id: 'alexa-skill',
        response_type: 'code',
        redirect_uri: ALLOWED_ALEXA_REDIRECT,
      })
      .expect(302);
    const loc = res.headers.location as string;
    expect(loc).toMatch(/session_code=/);
  });

  it('POST /auth/oauth/login — 200 após authorize', async () => {
    const authz = await request(app.getHttpServer())
      .get('/auth/oauth/authorize')
      .query({
        client_id: 'alexa-skill',
        response_type: 'code',
        redirect_uri: ALLOWED_ALEXA_REDIRECT,
      })
      .expect(302);
    const loc = authz.headers.location as string;
    const m = /session_code=([^&]+)/.exec(loc);
    expect(m).toBeTruthy();
    const sessionCode = decodeURIComponent(m[1]);

    const login = await request(app.getHttpServer())
      .post('/auth/oauth/login')
      .send({
        email: E2E_SEED_EMAIL,
        password: E2E_SEED_PASSWORD,
        session_code: sessionCode,
      })
      .expect(200);
    expect(login.body).toEqual(
      expect.objectContaining({
        redirectUrl: expect.stringContaining('code='),
      }),
    );
  });

  it('POST /auth/oauth/token — 200 com spy (segredo real bcrypt no seed)', async () => {
    const authService = app.get(AuthService);
    const spy = jest.spyOn(authService, 'oauthToken').mockResolvedValue({
      access_token: 'e2e-at',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'e2e-rt',
    });

    try {
      await request(app.getHttpServer())
        .post('/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'fake-code',
          client_id: 'alexa-skill',
          client_secret: 'any',
        })
        .expect(200);
    } finally {
      spy.mockRestore();
    }
  });

  it('POST /auth/oauth/token — 401 client inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/oauth/token')
      .send({
        grant_type: 'authorization_code',
        code: 'x',
        client_id: 'unknown-client',
        client_secret: 'x',
      });
    expect(res.status).toBe(401);
  });

  it('POST /alexa/intent — 401 sem accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/alexa/intent')
      .send({
        version: '1.0',
        request: {
          type: 'IntentRequest',
          intent: { name: 'ListItemsIntent' },
        },
      });
    expect(res.status).toBe(401);
  });

  it('POST /alexa/intent — 200 ListItemsIntent com JWT', async () => {
    const token = await loginAsSeedUser(app);
    const profile = await request(app.getHttpServer())
      .get('/profile')
      .set({ Authorization: `Bearer ${token}` })
      .expect(200);
    const userId = profile.body.user.id;

    const jwt = app.get(JwtService);
    const accessToken = await jwt.signAsync({
      sub: userId,
      username: E2E_SEED_EMAIL,
    });

    const res = await request(app.getHttpServer())
      .post('/alexa/intent')
      .send({
        version: '1.0',
        session: {
          user: { accessToken },
        },
        request: {
          type: 'IntentRequest',
          intent: { name: 'ListItemsIntent' },
        },
      })
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        version: expect.any(String),
        response: expect.objectContaining({
          outputSpeech: expect.objectContaining({ type: 'PlainText' }),
        }),
      }),
    );
  });

  it('POST /alexa/intent — 400 payload inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/alexa/intent')
      .send({ version: '1.0' });
    expectClientError(res);
  });
});
