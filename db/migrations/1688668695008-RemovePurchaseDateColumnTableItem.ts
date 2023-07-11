import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePurchaseDateColumnTableItem1688668695008
  implements MigrationInterface
{
  name = 'RemovePurchaseDateColumnTableItem1688668695008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`item\` DROP COLUMN \`purchaseDate\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`item\` ADD \`purchaseDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
  }
}
