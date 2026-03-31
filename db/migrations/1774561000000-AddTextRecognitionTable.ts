import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTextRecognitionTable1774561000000 implements MigrationInterface {
  name = 'AddTextRecognitionTable1774561000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`text_recognition\` (\`id\` varchar(36) NOT NULL, \`sourceText\` text NULL, \`provider\` varchar(50) NOT NULL, \`confidence\` float NOT NULL DEFAULT '0', \`result\` json NULL, \`status\` enum ('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING', \`error\` text NULL, \`userId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`text_recognition\` ADD CONSTRAINT \`FK_text_recognition_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`text_recognition\` DROP FOREIGN KEY \`FK_text_recognition_user\``,
    );
    await queryRunner.query(`DROP TABLE \`text_recognition\``);
  }
}
