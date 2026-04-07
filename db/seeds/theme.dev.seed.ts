import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const THEME_ROWS: Array<{
  name: string;
  theme: string;
  description: string;
  requiredCoins: number;
  background: string;
}> = [
  {
    name: 'RPG Medieval',
    theme: 'rpg',
    description: 'Tema medieval com elementos de RPG',
    requiredCoins: 500,
    background: 'background-theme-medieval.png',
  },
  {
    name: 'Modo Padrão',
    theme: 'default',
    description: 'Tema profissional para gestão financeira',
    requiredCoins: 0,
    background: 'background-theme-default.png',
  },
];

/**
 * Insere themes de desenvolvimento quando ainda não existem (chave lógica: coluna `theme`).
 */
export async function seedThemeDev(dataSource: DataSource): Promise<void> {
  for (const row of THEME_ROWS) {
    const existing = await dataSource.query(
      'SELECT `id` FROM `theme` WHERE `theme` = ? LIMIT 1',
      [row.theme],
    );

    if (existing?.length) {
      continue;
    }

    await dataSource.query(
      `INSERT INTO \`theme\`
        (\`id\`, \`name\`, \`theme\`, \`description\`, \`requiredCoins\`, \`background\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, NOW(6), NOW(6), NULL)`,
      [
        uuidv4(),
        row.name,
        row.theme,
        row.description,
        row.requiredCoins,
        row.background,
      ],
    );
  }
}
