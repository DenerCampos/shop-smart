import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApiUsage1763759051176 implements MigrationInterface {
    name = 'AddApiUsage1763759051176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`api_usage\` (\`id\` varchar(36) NOT NULL, \`provider\` varchar(50) NOT NULL, \`date\` date NOT NULL, \`requestCount\` int NOT NULL DEFAULT '0', \`dailyLimit\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`api_usage\``);
    }

}
