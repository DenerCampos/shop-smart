import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFinancialMissionDescriptions1775100000000
  implements MigrationInterface
{
  name = 'UpdateFinancialMissionDescriptions1775100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 80% da sua renda no mês passado e mantenha um colchão financeiro saudável. A avaliação considera despesas e receitas fechadas do mês anterior.'
      WHERE \`key\` = 'monthly_spend_under_80'
    `);

    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 60% da sua renda no mês passado e acelere seus objetivos financeiros. A avaliação considera despesas e receitas fechadas do mês anterior.'
      WHERE \`key\` = 'monthly_spend_under_60'
    `);

    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 50% da sua renda no mês passado e entre para o hall dos grandes poupadores do clã. A avaliação considera despesas e receitas fechadas do mês anterior.'
      WHERE \`key\` = 'monthly_spend_under_50'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 80% da sua renda mensal e mantenha um colchão financeiro saudável.'
      WHERE \`key\` = 'monthly_spend_under_80'
    `);

    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 60% da sua renda mensal e acelere seus objetivos financeiros.'
      WHERE \`key\` = 'monthly_spend_under_60'
    `);

    await queryRunner.query(`
      UPDATE \`mission_definition\`
      SET \`description\` = 'Gaste menos de 50% da sua renda mensal e entre para o hall dos grandes poupadores do clã.'
      WHERE \`key\` = 'monthly_spend_under_50'
    `);
  }
}
