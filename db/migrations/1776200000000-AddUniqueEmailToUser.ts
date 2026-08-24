import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Normaliza e-mails para minúsculas e cria UNIQUE(email).
 *
 * Antes de rodar em produção, verificar colisões (inclui soft-deleted):
 *   SELECT LOWER(email), COUNT(*) FROM `user` GROUP BY LOWER(email) HAVING COUNT(*) > 1;
 * Resolver manualmente qualquer resultado antes desta migration.
 */
export class AddUniqueEmailToUser1776200000000 implements MigrationInterface {
  name = 'AddUniqueEmailToUser1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`user\` SET \`email\` = LOWER(TRIM(\`email\`))`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_user_email_unique\` ON \`user\` (\`email\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_user_email_unique\` ON \`user\``);
  }
}
