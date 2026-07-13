import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandHealthExamItemReferenceRange1775700000000
  implements MigrationInterface
{
  name = 'ExpandHealthExamItemReferenceRange1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_item\` MODIFY \`referenceRange\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_exam_item\` MODIFY \`referenceRange\` varchar(255) NULL`,
    );
  }
}
