import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnUrlCoupon1686954287792 implements MigrationInterface {
    name = 'AddColumnUrlCoupon1686954287792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`url\` varchar(255) NULL AFTER number`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`url\``);
    }

}
