import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToPayment1754417812386 implements MigrationInterface {
    name = 'AddUserToPayment1754417812386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payment\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`payment\` ADD CONSTRAINT \`FK_b046318e0b341a7f72110b75857\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payment\` DROP FOREIGN KEY \`FK_b046318e0b341a7f72110b75857\``);
        await queryRunner.query(`ALTER TABLE \`payment\` DROP COLUMN \`userId\``);
    }

}
