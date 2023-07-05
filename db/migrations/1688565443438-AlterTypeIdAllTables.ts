import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTypeIdAllTables1688565443438 implements MigrationInterface {
    name = 'AlterTypeIdAllTables1688565443438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``);
        await queryRunner.query(`ALTER TABLE \`store\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`store\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_6b0100c5cb7c67d99ae46197727\``);
        await queryRunner.query(`ALTER TABLE \`group\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`group\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`group\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`group\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_7c03fe50a5928d547abe334633b\``);
        await queryRunner.query(`ALTER TABLE \`item\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`group_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`group_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`coupon_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`coupon_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_dd06e2d16e22cfa4e6e8f1e82cf\``);
        await queryRunner.query(`ALTER TABLE \`payment\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`payment\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`payment\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`payment\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`coupon\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`payment_id\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`payment_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_6b0100c5cb7c67d99ae46197727\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_7c03fe50a5928d547abe334633b\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupon\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_dd06e2d16e22cfa4e6e8f1e82cf\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_dd06e2d16e22cfa4e6e8f1e82cf\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_7c03fe50a5928d547abe334633b\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_6b0100c5cb7c67d99ae46197727\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`payment_id\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`payment_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`coupon\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`payment\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`payment\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`payment\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`payment\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_dd06e2d16e22cfa4e6e8f1e82cf\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`coupon_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`coupon_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`group_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`group_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`item\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_7c03fe50a5928d547abe334633b\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupon\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`group\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`group\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`group\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_6b0100c5cb7c67d99ae46197727\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`store\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`store\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
