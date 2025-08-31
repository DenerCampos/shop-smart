import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableTheme1756490633578 implements MigrationInterface {
    name = 'CreateTableTheme1756490633578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`theme\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`theme\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`requiredCoins\` int NOT NULL, \`background\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_theme\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`themeId\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_theme\` ADD CONSTRAINT \`FK_1280776acb7de5b0d9e06521923\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_theme\` ADD CONSTRAINT \`FK_a7af60da24d2f5ff34e18d44cbe\` FOREIGN KEY (\`themeId\`) REFERENCES \`theme\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_theme\` DROP FOREIGN KEY \`FK_a7af60da24d2f5ff34e18d44cbe\``);
        await queryRunner.query(`ALTER TABLE \`user_theme\` DROP FOREIGN KEY \`FK_1280776acb7de5b0d9e06521923\``);
        await queryRunner.query(`DROP TABLE \`user_theme\``);
        await queryRunner.query(`DROP TABLE \`theme\``);
    }

}
