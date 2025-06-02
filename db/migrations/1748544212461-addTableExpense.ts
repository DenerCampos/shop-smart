import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableExpense1748544212461 implements MigrationInterface {
    name = 'AddTableExpense1748544212461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`expense\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD CONSTRAINT \`FK_8aed1abe692b31639ccde1b0416\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expense\` DROP FOREIGN KEY \`FK_8aed1abe692b31639ccde1b0416\``);
        await queryRunner.query(`DROP TABLE \`expense\``);
    }

}
