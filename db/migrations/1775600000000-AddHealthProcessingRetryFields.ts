import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthProcessingRetryFields1775600000000
  implements MigrationInterface
{
  name = 'AddHealthProcessingRetryFields1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` ADD \`failedAt\` datetime(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` ADD \`retryCount\` int NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` DROP COLUMN \`retryCount\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` DROP COLUMN \`failedAt\``,
    );
  }
}
