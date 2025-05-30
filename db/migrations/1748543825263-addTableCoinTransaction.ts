import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableCoinTransaction1748543825263 implements MigrationInterface {
    name = 'AddTableCoinTransaction1748543825263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`coin_transaction\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal NOT NULL DEFAULT '0', \`transaction_type\` enum ('earn', 'spend', 'bonus', 'penalty', 'refund') NOT NULL, \`description\` varchar(255) NULL, \`balanceBefore\` decimal NOT NULL DEFAULT '0', \`balanceAfter\` decimal NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` ADD CONSTRAINT \`FK_f87df2508136995c1fdc47d3cc6\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` DROP FOREIGN KEY \`FK_f87df2508136995c1fdc47d3cc6\``);
        await queryRunner.query(`DROP TABLE \`coin_transaction\``);
    }

}
