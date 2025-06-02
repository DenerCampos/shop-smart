import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColRepeat1748548803250 implements MigrationInterface {
    name = 'AddColRepeat1748548803250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expense\` ADD \`repeat\` tinyint NOT NULL DEFAULT 0 AFTER \`value\``);
        await queryRunner.query(`ALTER TABLE \`revenue\` ADD \`repeat\` tinyint NOT NULL DEFAULT 0 AFTER \`value\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`revenue\` DROP COLUMN \`repeat\``);
        await queryRunner.query(`ALTER TABLE \`expense\` DROP COLUMN \`repeat\``);
    }

}
