import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableCoin1748543645178 implements MigrationInterface {
    name = 'AddTableCoin1748543645178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`coin\` (\`id\` varchar(36) NOT NULL, \`balance\` decimal NOT NULL DEFAULT '0', \`totalEarned\` decimal NOT NULL DEFAULT '0', \`totalSpent\` decimal NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`coin\` ADD CONSTRAINT \`FK_39be4cee4f899b71f52ac90440f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin\` DROP FOREIGN KEY \`FK_39be4cee4f899b71f52ac90440f\``);
        await queryRunner.query(`DROP TABLE \`coin\``);
    }

}
