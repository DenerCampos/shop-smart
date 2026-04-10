import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOauthCodeTable1774600001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`oauth_code\` (
        \`id\`          VARCHAR(36)   NOT NULL,
        \`code\`        VARCHAR(100)  NOT NULL,
        \`redirectUri\` VARCHAR(500)  NOT NULL,
        \`expiresAt\`   DATETIME      NOT NULL,
        \`createdAt\`   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`userId\`      VARCHAR(36)   NULL,
        \`clientId\`    VARCHAR(36)   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_oauth_code_code\` (\`code\`),
        CONSTRAINT \`FK_oauth_code_user\`
          FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_oauth_code_client\`
          FOREIGN KEY (\`clientId\`) REFERENCES \`oauth_client\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`oauth_code\``);
  }
}
