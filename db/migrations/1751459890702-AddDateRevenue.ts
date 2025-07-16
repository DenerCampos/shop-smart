import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateRevenue1751459890702 implements MigrationInterface {
    name = 'AddDateRevenue1751459890702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`revenue\` ADD \`date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER \`repeat\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`revenue\` DROP COLUMN \`date\``);
    }

}
