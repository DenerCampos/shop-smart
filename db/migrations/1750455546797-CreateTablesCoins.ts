import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablesCoins1750455546797 implements MigrationInterface {
    name = 'CreateTablesCoins1750455546797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`coin_transaction\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal NOT NULL DEFAULT '0', \`transactionType\` enum ('earn', 'spend', 'bonus', 'penalty', 'refund') NOT NULL, \`description\` varchar(255) NULL, \`balanceBefore\` decimal NOT NULL DEFAULT '0', \`balanceAfter\` decimal NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`coin\` (\`id\` varchar(36) NOT NULL, \`balance\` decimal NOT NULL DEFAULT '0', \`totalEarned\` decimal NOT NULL DEFAULT '0', \`totalSpent\` decimal NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_fe4e00016d080cabf19bd15fe9\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` ADD CONSTRAINT \`FK_09cd6e36e2f52da0f9ddffb7434\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coin\` ADD CONSTRAINT \`FK_fe4e00016d080cabf19bd15fe9d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin\` DROP FOREIGN KEY \`FK_fe4e00016d080cabf19bd15fe9d\``);
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` DROP FOREIGN KEY \`FK_09cd6e36e2f52da0f9ddffb7434\``);
        await queryRunner.query(`DROP INDEX \`REL_fe4e00016d080cabf19bd15fe9\` ON \`coin\``);
        await queryRunner.query(`DROP TABLE \`coin\``);
        await queryRunner.query(`DROP TABLE \`coin_transaction\``);
    }

}
