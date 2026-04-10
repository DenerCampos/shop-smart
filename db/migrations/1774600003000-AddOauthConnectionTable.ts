import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOauthConnectionTable1774600003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`oauth_connection\` (
        \`id\`        VARCHAR(36)  NOT NULL,
        \`linkedAt\`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`userId\`    VARCHAR(36)  NULL,
        \`clientId\`  VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_oauth_connection_user_client\` (\`userId\`, \`clientId\`),
        CONSTRAINT \`FK_oauth_connection_user\`
          FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_oauth_connection_client\`
          FOREIGN KEY (\`clientId\`) REFERENCES \`oauth_client\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`oauth_connection\``);
  }
}
