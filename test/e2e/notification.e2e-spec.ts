import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  actorName: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

async function waitForInviteNotification(
  app: INestApplication,
  token: string,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<NotificationItem> {
  const attempts = options.attempts ?? 20;
  const delayMs = options.delayMs ?? 100;

  for (let i = 0; i < attempts; i++) {
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .query({ limit: 20 })
      .set(bearerAuth(token));

    if (list.status === 200 && Array.isArray(list.body)) {
      const invite = list.body.find(
        (item: NotificationItem) => item.type === 'family_group_invite',
      ) as NotificationItem | undefined;
      if (invite) {
        return invite;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    'Timeout: notificação family_group_invite não apareceu após o convite',
  );
}

describe('Notification (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    adminToken = await loginAsSeedUser(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /notifications — 401 sem Bearer', async () => {
    const res = await request(app.getHttpServer()).get('/notifications');
    expect(res.status).toBe(401);
  });

  it('lista, unread-count e mark-read; convite gera notificação', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/family-group')
      .set(bearerAuth(adminToken))
      .send({ name: `Família notif ${Date.now()}` })
      .expect(201);
    const groupId = groupRes.body.id as string;

    const invitedEmail = `e2e-notif-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'Convidado Notif',
        email: invitedEmail,
        password: 'Valid123',
        family: 'Convidado',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/family-group/${groupId}/invite`)
      .set(bearerAuth(adminToken))
      .send({ email: invitedEmail })
      .expect(201);

    const loginInvited = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: invitedEmail, password: 'Valid123' })
      .expect(200);
    const invitedToken = loginInvited.body.accessToken as string;

    const inviteNotification = await waitForInviteNotification(
      app,
      invitedToken,
    );

    const unread = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set(bearerAuth(invitedToken))
      .expect(200);
    expect(unread.body.count).toBeGreaterThanOrEqual(1);

    expect(inviteNotification).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'family_group_invite',
        title: 'Convite para grupo familiar',
        body: expect.stringContaining('convidado'),
        actorName: expect.any(String),
        actionUrl: '/new-resources/family?tab=invitations',
        readAt: null,
        createdAt: expect.any(String),
      }),
    );

    const mark = await request(app.getHttpServer())
      .patch('/notifications/read')
      .set(bearerAuth(invitedToken))
      .send({ ids: [inviteNotification.id] })
      .expect(200);
    expect(mark.body.updated).toBeGreaterThanOrEqual(1);

    const unreadAfter = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set(bearerAuth(invitedToken))
      .expect(200);
    expect(unreadAfter.body.count).toBe(0);
  });
});
