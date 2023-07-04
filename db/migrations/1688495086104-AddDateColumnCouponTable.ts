import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateColumnCouponTable1688495086104
  implements MigrationInterface
{
  name = 'AddDateColumnCouponTable1688495086104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD \`date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER url`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`date\``);
  }
}
