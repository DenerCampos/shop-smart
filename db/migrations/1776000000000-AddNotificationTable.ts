import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTable1776000000000 implements MigrationInterface {
  name = 'AddNotificationTable1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`notification\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`type\` varchar(64) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`body\` text NOT NULL,
        \`actorName\` varchar(255) NOT NULL,
        \`actionUrl\` varchar(512) NULL,
        \`data\` json NULL,
        \`readAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_notification_user_read_created\` (\`userId\`, \`readAt\`, \`createdAt\`),
        CONSTRAINT \`FK_notification_user\`
          FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notification\``);
  }
}
