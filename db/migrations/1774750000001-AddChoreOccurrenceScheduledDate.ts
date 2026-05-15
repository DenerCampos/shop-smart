import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChoreOccurrenceScheduledDate1774750000001
  implements MigrationInterface
{
  name = 'AddChoreOccurrenceScheduledDate1774750000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD \`scheduledDate\` datetime NULL AFTER \`earnedPeriodYm\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP COLUMN \`scheduledDate\``,
    );
  }
}
