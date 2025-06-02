import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveColumnUsers1748890300793 implements MigrationInterface {
    name = 'RemoveColumnUsers1748890300793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`income\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`expenses\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`coins\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`coins\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`expenses\` decimal(10,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`income\` decimal(10,2) NOT NULL DEFAULT '0.00'`);
    }

}
