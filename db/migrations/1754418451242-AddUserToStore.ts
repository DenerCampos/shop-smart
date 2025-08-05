import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToStore1754418451242 implements MigrationInterface {
    name = 'AddUserToStore1754418451242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`store\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`store\` ADD CONSTRAINT \`FK_3f82dbf41ae837b8aa0a27d29c3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`store\` DROP FOREIGN KEY \`FK_3f82dbf41ae837b8aa0a27d29c3\``);
        await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`userId\``);
    }

}
