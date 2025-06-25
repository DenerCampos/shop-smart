import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablesExpenseRevenue1750451641525 implements MigrationInterface {
    name = 'CreateTablesExpenseRevenue1750451641525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`group\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payment\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`store\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`revenue\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`repeat\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`expense\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`url\` varchar(255) NULL, \`value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`repeat\` tinyint NOT NULL DEFAULT 0, \`date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`storeId\` varchar(36) NULL, \`paymentId\` varchar(36) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`item\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`quantity\` float NOT NULL, \`unit\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL, \`total\` decimal(10,2) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`groupId\` varchar(36) NULL, \`expenseId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`revenue\` ADD CONSTRAINT \`FK_34de35e03813be5fd575b32099a\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD CONSTRAINT \`FK_af4e24a7d41856c757d59118304\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD CONSTRAINT \`FK_3930ac972bed86781f4894f571d\` FOREIGN KEY (\`paymentId\`) REFERENCES \`payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`expense\` ADD CONSTRAINT \`FK_06e076479515578ab1933ab4375\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_94c5f1b2d8b84ca708881e2430e\` FOREIGN KEY (\`groupId\`) REFERENCES \`group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_cf02936e217b858b7e3d4c8ebac\` FOREIGN KEY (\`expenseId\`) REFERENCES \`expense\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_cf02936e217b858b7e3d4c8ebac\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_94c5f1b2d8b84ca708881e2430e\``);
        await queryRunner.query(`ALTER TABLE \`expense\` DROP FOREIGN KEY \`FK_06e076479515578ab1933ab4375\``);
        await queryRunner.query(`ALTER TABLE \`expense\` DROP FOREIGN KEY \`FK_3930ac972bed86781f4894f571d\``);
        await queryRunner.query(`ALTER TABLE \`expense\` DROP FOREIGN KEY \`FK_af4e24a7d41856c757d59118304\``);
        await queryRunner.query(`ALTER TABLE \`revenue\` DROP FOREIGN KEY \`FK_34de35e03813be5fd575b32099a\``);
        await queryRunner.query(`DROP TABLE \`item\``);
        await queryRunner.query(`DROP TABLE \`expense\``);
        await queryRunner.query(`DROP TABLE \`revenue\``);
        await queryRunner.query(`DROP TABLE \`store\``);
        await queryRunner.query(`DROP TABLE \`payment\``);
        await queryRunner.query(`DROP TABLE \`group\``);
    }

}
