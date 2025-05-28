import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1748202389762 implements MigrationInterface {
    name = 'InitialMigration1748202389762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`store\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`item\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`quantity\` float NOT NULL, \`unit\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL, \`total\` decimal(10,2) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`group_id\` varchar(36) NULL, \`coupon_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payment\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`family\` varchar(255) NOT NULL, \`income\` decimal(10,2) NOT NULL DEFAULT '0.00', \`expenses\` decimal(10,2) NOT NULL DEFAULT '0.00', \`coins\` int NOT NULL DEFAULT '0', \`coatOfArms\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`coupon\` (\`id\` varchar(36) NOT NULL, \`number\` varchar(255) NOT NULL, \`url\` varchar(255) NULL, \`value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`store_id\` varchar(36) NULL, \`payment_id\` varchar(36) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_6b0100c5cb7c67d99ae46197727\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_7c03fe50a5928d547abe334633b\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupon\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_dd06e2d16e22cfa4e6e8f1e82cf\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_05e2d1d174be912392277fc095c\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_05e2d1d174be912392277fc095c\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_dd06e2d16e22cfa4e6e8f1e82cf\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_7c03fe50a5928d547abe334633b\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_6b0100c5cb7c67d99ae46197727\``);
        await queryRunner.query(`DROP TABLE \`coupon\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`payment\``);
        await queryRunner.query(`DROP TABLE \`item\``);
        await queryRunner.query(`DROP TABLE \`group\``);
        await queryRunner.query(`DROP TABLE \`store\``);
    }

}
