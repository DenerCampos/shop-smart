import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableRevenue1748540653977 implements MigrationInterface {
    name = 'AddTableRevenue1748540653977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`revenue\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`revenue\` ADD CONSTRAINT \`FK_8723639d15c98d7e4c0c7552959\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`revenue\` DROP FOREIGN KEY \`FK_8723639d15c98d7e4c0c7552959\``);
        await queryRunner.query(`DROP TABLE \`revenue\``);
    }

}
