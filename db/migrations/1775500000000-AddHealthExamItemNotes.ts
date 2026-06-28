import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthExamItemNotes1775500000000 implements MigrationInterface {
  name = 'AddHealthExamItemNotes1775500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_item\` ADD \`itemNotes\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_item\` DROP COLUMN \`itemNotes\``,
    );
  }
}
