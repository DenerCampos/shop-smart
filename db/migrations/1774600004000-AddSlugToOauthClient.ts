import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToOauthClient1774600004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`oauth_client\` ADD \`slug\` VARCHAR(50) NOT NULL DEFAULT '' AFTER \`clientId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_client\` ADD UNIQUE INDEX \`IDX_oauth_client_slug\` (\`slug\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_client\` ALTER COLUMN \`slug\` DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`oauth_client\` DROP INDEX \`IDX_oauth_client_slug\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_client\` DROP COLUMN \`slug\``,
    );
  }
}
