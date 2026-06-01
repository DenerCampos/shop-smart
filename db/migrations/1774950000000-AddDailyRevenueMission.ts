import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyRevenueMission1774950000000 implements MigrationInterface {
  name = 'AddDailyRevenueMission1774950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`mission_definition\` (\`id\`, \`key\`, \`title\`, \`description\`, \`frequency\`, \`rewardCoins\`, \`targetValue\`, \`isActive\`) VALUES
      (UUID(), 'daily_revenue', 'Receita do Dia', 'Cadastre uma receita para registrar sua renda e ganhar moedas.', 'DAILY', 20, 1, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`mission_definition\` WHERE \`key\` = 'daily_revenue'
    `);
  }
}
