import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/** Credenciais fixas só para desenvolvimento (login por e-mail). */
const DEV_TEST_USER = {
  name: 'teste',
  email: 'teste@dev.local',
  passwordPlain: 'Valid123',
  family: 'teste',
  coatOfArms: '/assets/images/brasao/brasao-1.png',
} as const;

function getBcryptRounds(): number {
  const n = Number(process.env.BCRYPT_SALT);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

export async function seedDevTestUser(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(
    'SELECT `id` FROM `user` WHERE `email` = ? LIMIT 1',
    [DEV_TEST_USER.email],
  );

  if (existing?.length) {
    return;
  }

  const passwordHash = await bcrypt.hash(
    DEV_TEST_USER.passwordPlain,
    getBcryptRounds(),
  );

  const userId = uuidv4();

  await dataSource.query(
    `INSERT INTO \`user\`
      (\`id\`, \`name\`, \`email\`, \`family\`, \`coatOfArms\`, \`password\`, \`token\`, \`refreshtoken\`, \`profileImage\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(6), NOW(6), NULL)`,
    [
      userId,
      DEV_TEST_USER.name,
      DEV_TEST_USER.email,
      DEV_TEST_USER.family,
      DEV_TEST_USER.coatOfArms,
      passwordHash,
    ],
  );

  const defaultThemes = await dataSource.query(
    'SELECT `id` FROM `theme` WHERE `requiredCoins` = 0 ORDER BY `createdAt` ASC LIMIT 1',
  );

  const defaultThemeId = defaultThemes?.[0]?.id as string | undefined;

  if (defaultThemeId) {
    const ut = await dataSource.query(
      'SELECT `id` FROM `user_theme` WHERE `userId` = ? AND `themeId` = ? LIMIT 1',
      [userId, defaultThemeId],
    );

    if (!ut?.length) {
      await dataSource.query(
        `INSERT INTO \`user_theme\`
          (\`id\`, \`userId\`, \`themeId\`, \`isActive\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
         VALUES (?, ?, ?, 1, NOW(6), NOW(6), NULL)`,
        [uuidv4(), userId, defaultThemeId],
      );
    }
  }

  const existingCoin = await dataSource.query(
    'SELECT `id` FROM `coin` WHERE `userId` = ? LIMIT 1',
    [userId],
  );

  if (!existingCoin?.length) {
    await dataSource.query(
      `INSERT INTO \`coin\`
        (\`id\`, \`balance\`, \`totalEarned\`, \`totalSpent\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`, \`userId\`)
       VALUES (?, 0, 0, 0, NOW(6), NOW(6), NULL, ?)`,
      [uuidv4(), userId],
    );
  }
}
