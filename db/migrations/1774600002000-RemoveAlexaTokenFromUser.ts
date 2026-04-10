import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAlexaTokenFromUser1774600002000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP INDEX \`IDX_e3c1c267d035496a583b57b5d0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`alexaToken\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`alexaToken\` VARCHAR(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e3c1c267d035496a583b57b5d0\` (\`alexaToken\`)`,
    );
  }
}
