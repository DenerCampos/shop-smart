import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTypeDecimalTableItem1687354096888
  implements MigrationInterface
{
  name = 'AlterTypeDecimalTableItem1687354096888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`value\` \`value\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`total\` \`total\` decimal(10,2) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`total\` \`total\` decimal(10,0) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`value\` \`value\` decimal(10,0) NOT NULL`,
    );
  }
}
