import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatAgentTables1775800000000 implements MigrationInterface {
  name = 'AddChatAgentTables1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`chat_session\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`title\` varchar(255) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_chat_session_user_deleted\` (\`userId\`, \`deletedAt\`),
        CONSTRAINT \`FK_chat_session_user\`
          FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`chat_message\` (
        \`id\` varchar(36) NOT NULL,
        \`sessionId\` varchar(36) NOT NULL,
        \`role\` enum('user', 'assistant', 'system') NOT NULL,
        \`content\` text NOT NULL,
        \`screenContext\` varchar(255) NULL,
        \`toolTrace\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_chat_message_session_created\` (\`sessionId\`, \`createdAt\`),
        CONSTRAINT \`FK_chat_message_session\`
          FOREIGN KEY (\`sessionId\`) REFERENCES \`chat_session\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`chat_message\``);
    await queryRunner.query(`DROP TABLE \`chat_session\``);
  }
}
