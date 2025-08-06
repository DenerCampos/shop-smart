import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToGroup1754416592772 implements MigrationInterface {
    name = 'AddUserToGroup1754416592772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`group\` ADD CONSTRAINT \`FK_7bec24423f57c3786409cc3cc8d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group\` DROP FOREIGN KEY \`FK_7bec24423f57c3786409cc3cc8d\``);
        await queryRunner.query(`ALTER TABLE \`group\` DROP COLUMN \`userId\``);
    }
}
