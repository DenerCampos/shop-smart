import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1750105532973 implements MigrationInterface {
    name = 'CreateTableUser1750105532973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`family\` varchar(255) NOT NULL, \`coatOfArms\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` varchar(255) NULL, \`refreshtoken\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`user\``);
    }

}
