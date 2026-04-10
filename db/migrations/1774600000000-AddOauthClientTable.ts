import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOauthClientTable1774600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`oauth_client\` (
        \`id\`           VARCHAR(36)   NOT NULL,
        \`clientId\`     VARCHAR(100)  NOT NULL,
        \`name\`         VARCHAR(150)  NOT NULL,
        \`clientSecret\` VARCHAR(255)  NOT NULL,
        \`redirectUris\` TEXT          NOT NULL,
        \`createdAt\`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_oauth_client_clientId\` (\`clientId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`oauth_client\``);
  }
}
