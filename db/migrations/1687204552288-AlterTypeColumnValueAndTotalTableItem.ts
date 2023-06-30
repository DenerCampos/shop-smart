import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTypeColumnValueAndTotalTableItem1687204552288
  implements MigrationInterface
{
  name = 'AlterTypeColumnValueAndTotalTableItem1687204552288';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`value\``);
    await queryRunner.query(
      `ALTER TABLE \`item\` ADD \`value\` decimal NOT NULL AFTER unit`,
    );
    await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`total\``);
    await queryRunner.query(
      `ALTER TABLE \`item\` ADD \`total\` decimal NOT NULL AFTER value`,
    );
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`purchaseDate\` \`purchaseDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER total`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`item\` CHANGE \`purchaseDate\` \`purchaseDate\` datetime NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`total\``);
    await queryRunner.query(
      `ALTER TABLE \`item\` ADD \`total\` float(12) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`value\``);
    await queryRunner.query(
      `ALTER TABLE \`item\` ADD \`value\` float(12) NOT NULL`,
    );
  }
}
