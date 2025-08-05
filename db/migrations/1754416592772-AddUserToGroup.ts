import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToGroup1754416592772 implements MigrationInterface {
    name = 'AddUserToGroup1754416592772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_ct02936e2t7b858b7e3d4c8ebac\` ON \`item\``);
        await queryRunner.query(`ALTER TABLE \`group\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_cf02936e217b858b7e3d4c8ebac\` FOREIGN KEY (\`expenseId\`) REFERENCES \`expense\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group\` ADD CONSTRAINT \`FK_7bec24423f57c3786409cc3cc8d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group\` DROP FOREIGN KEY \`FK_7bec24423f57c3786409cc3cc8d\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_cf02936e217b858b7e3d4c8ebac\``);
        await queryRunner.query(`ALTER TABLE \`group\` DROP COLUMN \`userId\``);
        await queryRunner.query(`CREATE INDEX \`FK_ct02936e2t7b858b7e3d4c8ebac\` ON \`item\` (\`expenseId\`)`);
    }

}
