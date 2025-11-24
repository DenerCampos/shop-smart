import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAudioRecognitionTable1763988649214 implements MigrationInterface {
    name = 'CreateAudioRecognitionTable1763988649214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`audio_recognition\` (\`id\` varchar(36) NOT NULL, \`audioUrl\` varchar(255) NULL, \`provider\` varchar(50) NOT NULL, \`confidence\` float NOT NULL DEFAULT '0', \`result\` json NULL, \`status\` enum ('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING', \`error\` text NULL, \`userId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`audio_recognition\` ADD CONSTRAINT \`FK_47bc47253102bb4a456a12d7af6\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`audio_recognition\` DROP FOREIGN KEY \`FK_47bc47253102bb4a456a12d7af6\``);
        await queryRunner.query(`DROP TABLE \`audio_recognition\``);
    }

}
