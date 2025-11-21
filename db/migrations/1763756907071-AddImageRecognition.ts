import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageRecognition1763756907071 implements MigrationInterface {
    name = 'AddImageRecognition1763756907071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`image_recognition\` (\`id\` varchar(36) NOT NULL, \`imageUrl\` varchar(255) NOT NULL, \`provider\` varchar(255) NOT NULL, \`status\` enum ('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING', \`result\` json NULL, \`confidence\` decimal(5,2) NULL, \`error\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`image_recognition\` ADD CONSTRAINT \`FK_e01edf206c30c04b7ca3f28a97f\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`image_recognition\` DROP FOREIGN KEY \`FK_e01edf206c30c04b7ca3f28a97f\``);
        await queryRunner.query(`DROP TABLE \`image_recognition\``);
    }

}
