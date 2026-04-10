import { DataSource } from 'typeorm';

const OAUTH_CLIENT_ROWS: Array<{
  id: string;
  clientId: string;
  slug: string;
  name: string;
  clientSecret: string;
  redirectUris: string[];
}> = [
  {
    id: '5098e727-863a-4464-926e-462a4a754b2a',
    clientId: 'alexa-skill',
    slug: 'alexa',
    name: 'Alexa',
    clientSecret:
      '$2b$10$4Gpg3iblSySfr1hFBGpOiOkkcZ0QoDWw4/stOBsvbO.6FR4vNfMNW',
    redirectUris: [
      'https://alexa.amazon.co.jp/api/skill/link/MS4WVQL7EX52W',
      'https://pitangui.amazon.com/api/skill/link/MS4WVQL7EX52W',
      'https://layla.amazon.com/api/skill/link/MS4WVQL7EX52W',
    ],
  },
];

/**
 * Insere oauth_clients quando ainda não existem (chave lógica: coluna `clientId`).
 */
export async function seedOauthClientDev(dataSource: DataSource): Promise<void> {
  for (const row of OAUTH_CLIENT_ROWS) {
    const existing = await dataSource.query(
      'SELECT `id` FROM `oauth_client` WHERE `clientId` = ? LIMIT 1',
      [row.clientId],
    );

    if (existing?.length) {
      continue;
    }

    await dataSource.query(
      `INSERT INTO \`oauth_client\`
        (\`id\`, \`clientId\`, \`slug\`, \`name\`, \`clientSecret\`, \`redirectUris\`, \`createdAt\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, NOW(6), NOW(6))`,
      [
        row.id,
        row.clientId,
        row.slug,
        row.name,
        row.clientSecret,
        JSON.stringify(row.redirectUris),
      ],
    );
  }
}
