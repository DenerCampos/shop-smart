import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCoupon1686524363730 implements MigrationInterface {
    name = 'CreateCoupon1686524363730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_a5d9e6f65228000a2a1cb6445a8\``);
        await queryRunner.query(`ALTER TABLE \`item\` CHANGE \`store_id\` \`coupon_id\` int NULL`);
        await queryRunner.query(`CREATE TABLE \`coupon\` (\`id\` int NOT NULL AUTO_INCREMENT, \`number\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`store_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_7c03fe50a5928d547abe334633b\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupon\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_7c03fe50a5928d547abe334633b\``);
        await queryRunner.query(`DROP TABLE \`coupon\``);
        await queryRunner.query(`ALTER TABLE \`item\` CHANGE \`coupon_id\` \`store_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_a5d9e6f65228000a2a1cb6445a8\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
