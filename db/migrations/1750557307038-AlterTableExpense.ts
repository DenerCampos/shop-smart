import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTableExpense1750557307038 implements MigrationInterface {
    name = 'AlterTableExpense1750557307038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expense\` CHANGE \`url\` \`uri\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`expense\` DROP COLUMN \`uri\``);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD \`uri\` varchar(255) NULL AFTER \`name\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expense\` DROP COLUMN \`uri\``);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD \`uri\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`expense\` CHANGE \`uri\` \`url\` varchar(255) NULL`);
    }

}
