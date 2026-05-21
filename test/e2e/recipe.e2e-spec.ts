import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import {
  bearerAuth,
  createE2eApplication,
  loginAsSeedUser,
} from './helpers/create-e2e-app';
import { expectPaginatedEnvelope } from './helpers/expect-response';

const VALID_PASSWORD = 'Valid123';

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: VALID_PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}

async function insertUser(
  app: INestApplication,
  email: string,
): Promise<void> {
  const ds = app.get(DataSource);
  const existing = await ds.query(
    'SELECT `id` FROM `user` WHERE `email` = ? LIMIT 1',
    [email],
  );
  if (existing?.length) {
    return;
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);

  await ds.query(
    `INSERT INTO \`user\`
      (\`id\`, \`name\`, \`email\`, \`family\`, \`coatOfArms\`, \`password\`, \`token\`, \`refreshtoken\`, \`profileImage\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(6), NOW(6), NULL)`,
    [
      userId,
      'e2e recipe user',
      email,
      'e2e',
      '/assets/images/brasao/brasao-1.png',
      passwordHash,
    ],
  );

  await ds.query(
    `INSERT INTO \`coin\`
      (\`id\`, \`balance\`, \`totalEarned\`, \`totalSpent\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`, \`userId\`)
     VALUES (?, 0, 0, 0, NOW(6), NOW(6), NULL, ?)`,
    [randomUUID(), userId],
  );
}

describe('Recipes (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  /** E-mails únicos por execução para evitar conflito de grupo familiar residual no DB de teste. */
  let emailB: string;
  let emailC: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    tokenA = await loginAsSeedUser(app);
    const suffix = Date.now();
    emailB = `recipe-e2e-member-${suffix}@local.test`;
    emailC = `recipe-e2e-outsider-${suffix}@local.test`;
    await insertUser(app, emailB);
    await insertUser(app, emailC);
  });

  afterAll(async () => {
    await app.close();
  });

  const minimalRecipeBody = () => ({
    title: `Receita e2e ${Date.now()}`,
    ingredients: [{ name: 'farinha', quantity: 1, unit: 'kg' }],
    instructions: 'Misture e asse.',
  });

  it('CRUD mínimo + gerar lista de compras', async () => {
    const create = await request(app.getHttpServer())
      .post('/recipes')
      .set(bearerAuth(tokenA))
      .send(minimalRecipeBody())
      .expect(201);

    const id = create.body.id as string;
    expect(id).toBeDefined();

    const listRes = await request(app.getHttpServer())
      .get('/recipes')
      .query({ page: 1, limit: 10 })
      .set(bearerAuth(tokenA))
      .expect(200);
    expectPaginatedEnvelope(listRes.body);

    const one = await request(app.getHttpServer())
      .get(`/recipes/${id}`)
      .set(bearerAuth(tokenA))
      .expect(200);
    expect(one.body).toEqual(
      expect.objectContaining({
        id,
        title: expect.any(String),
        ingredients: expect.any(Array),
      }),
    );

    await request(app.getHttpServer())
      .patch(`/recipes/${id}`)
      .set(bearerAuth(tokenA))
      .send({ title: 'Receita atualizada' })
      .expect(200);

    const shop = await request(app.getHttpServer())
      .post(`/recipes/${id}/shopping-list`)
      .set(bearerAuth(tokenA))
      .expect(201);

    expect(shop.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        itemsByCategory: expect.any(Object),
      }),
    );

    await request(app.getHttpServer())
      .delete(`/recipes/${id}`)
      .set(bearerAuth(tokenA))
      .expect(200);
  });

  it('isolamento: receita individual — outro usuário recebe 403', async () => {
    const create = await request(app.getHttpServer())
      .post('/recipes')
      .set(bearerAuth(tokenA))
      .send(minimalRecipeBody())
      .expect(201);

    const id = create.body.id as string;
    const tokenB = await login(app, emailB);

    await request(app.getHttpServer())
      .get(`/recipes/${id}`)
      .set(bearerAuth(tokenB))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/recipes/${id}`)
      .set(bearerAuth(tokenA))
      .expect(200);
  });

  it('isolamento familiar — outsider 403; membro edita mas não apaga receita do outro', async () => {
    const tokenOutsider = await login(app, emailC);

    const groupA = await request(app.getHttpServer())
      .post('/family-group')
      .set(bearerAuth(tokenA))
      .send({ name: `Família recipes A ${Date.now()}` })
      .expect(201);
    const groupId = groupA.body.id as string;

    await request(app.getHttpServer())
      .post(`/family-group/${groupId}/invite`)
      .set(bearerAuth(tokenA))
      .send({ email: emailB })
      .expect(201);

    const tokenMember = await login(app, emailB);
    const invitations = await request(app.getHttpServer())
      .get('/family-group/invitations')
      .set(bearerAuth(tokenMember))
      .expect(200);

    const invitationId = invitations.body[0].id as string;
    await request(app.getHttpServer())
      .patch(`/family-group/invitations/${invitationId}/accept`)
      .set(bearerAuth(tokenMember))
      .expect(200);

    const recipeRes = await request(app.getHttpServer())
      .post('/recipes')
      .set(bearerAuth(tokenA))
      .send({
        ...minimalRecipeBody(),
        title: `Família ${Date.now()}`,
        familyGroupId: groupId,
      })
      .expect(201);

    const recipeId = recipeRes.body.id as string;

    await request(app.getHttpServer())
      .get(`/recipes/${recipeId}`)
      .set(bearerAuth(tokenOutsider))
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set(bearerAuth(tokenMember))
      .send({ title: 'Editado pelo membro' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set(bearerAuth(tokenMember))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set(bearerAuth(tokenA))
      .expect(200);
  });

  it('POST /recipes sem token — 401', async () => {
    await request(app.getHttpServer()).post('/recipes').send({}).expect(401);
  });
});
