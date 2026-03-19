import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFamilyGroupAndProfileImage1773694199576 implements MigrationInterface {
    name = 'AddFamilyGroupAndProfileImage1773694199576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`family_group\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`ownerId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`family_group_member\` (\`id\` varchar(36) NOT NULL, \`invitedEmail\` varchar(255) NOT NULL, \`role\` enum ('admin', 'member') NOT NULL DEFAULT 'member', \`status\` enum ('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending', \`joinedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`familyGroupId\` varchar(36) NULL, \`userId\` varchar(36) NULL, \`invitedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`profileImage\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`family_group\` ADD CONSTRAINT \`FK_e7f37d371c7e6c84ecc3c857190\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`family_group_member\` ADD CONSTRAINT \`FK_bbdd053c1c8c400f8750ac5098d\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`family_group_member\` ADD CONSTRAINT \`FK_c39d729a16403163bf1dcd65197\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`family_group_member\` ADD CONSTRAINT \`FK_7560048b910271580c25a8053bb\` FOREIGN KEY (\`invitedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`family_group_member\` DROP FOREIGN KEY \`FK_7560048b910271580c25a8053bb\``);
        await queryRunner.query(`ALTER TABLE \`family_group_member\` DROP FOREIGN KEY \`FK_c39d729a16403163bf1dcd65197\``);
        await queryRunner.query(`ALTER TABLE \`family_group_member\` DROP FOREIGN KEY \`FK_bbdd053c1c8c400f8750ac5098d\``);
        await queryRunner.query(`ALTER TABLE \`family_group\` DROP FOREIGN KEY \`FK_e7f37d371c7e6c84ecc3c857190\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`profileImage\``);
        await queryRunner.query(`DROP TABLE \`family_group_member\``);
        await queryRunner.query(`DROP TABLE \`family_group\``);
    }

}
