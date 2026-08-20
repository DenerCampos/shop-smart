import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetToken1776300000000 implements MigrationInterface {
  name = 'AddPasswordResetToken1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`user\`
        ADD \`tokenVersion\` int NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      CREATE TABLE \`password_reset_token\` (
        \`id\` varchar(36) NOT NULL,
        \`tokenHash\` varchar(64) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`usedAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_password_reset_token_hash\` (\`tokenHash\`),
        INDEX \`IDX_password_reset_token_user_created\` (\`userId\`, \`createdAt\`),
        CONSTRAINT \`FK_password_reset_token_user\`
          FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`password_reset_token\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`tokenVersion\``);
  }
}
