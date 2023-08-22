import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCoupon1692391704651 implements MigrationInterface {
  name = 'AddUserCoupon1692391704651';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD \`user_id\` varchar(36) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`user_id\``);
  }
}
