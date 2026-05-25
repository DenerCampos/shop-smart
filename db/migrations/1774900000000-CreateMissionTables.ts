import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMissionTables1774900000000 implements MigrationInterface {
  name = 'CreateMissionTables1774900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`mission_definition\` (
        \`id\` varchar(36) NOT NULL,
        \`key\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`frequency\` enum('DAILY','MONTHLY','ONCE') NOT NULL,
        \`rewardCoins\` int NOT NULL,
        \`targetValue\` int NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_mission_definition_key\` (\`key\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`user_mission_progress\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`missionDefinitionId\` varchar(36) NOT NULL,
        \`currentValue\` int NOT NULL DEFAULT 0,
        \`isCompleted\` tinyint NOT NULL DEFAULT 0,
        \`isClaimed\` tinyint NOT NULL DEFAULT 0,
        \`lastUpdatedAt\` datetime NULL,
        \`resetAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_user_mission_progress\` (\`userId\`, \`missionDefinitionId\`),
        INDEX \`IDX_user_mission_userId\` (\`userId\`),
        INDEX \`IDX_user_mission_definitionId\` (\`missionDefinitionId\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_mission_progress\`
      ADD CONSTRAINT \`FK_user_mission_progress_user\`
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_mission_progress\`
      ADD CONSTRAINT \`FK_user_mission_progress_definition\`
      FOREIGN KEY (\`missionDefinitionId\`) REFERENCES \`mission_definition\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Seed: 8 missões iniciais
    await queryRunner.query(`
      INSERT INTO \`mission_definition\` (\`id\`, \`key\`, \`title\`, \`description\`, \`frequency\`, \`rewardCoins\`, \`targetValue\`, \`isActive\`) VALUES
      (UUID(), 'daily_login',            'Acesso Diário',                    'Entre no aplicativo todos os dias para manter a sequência.',                                              'DAILY',   5,   1, 1),
      (UUID(), 'daily_coupon',           'Scanner do Dia',                   'Cadastre um cupom fiscal para acompanhar seus gastos e ganhar moedas.',                                  'DAILY',   15,  1, 1),
      (UUID(), 'monthly_shopping_list',  'Lista Colaborativa',               'Crie uma lista de compras familiar e envolva toda a família no planejamento.',                           'MONTHLY', 50,  1, 1),
      (UUID(), 'monthly_chore_complete', 'Tarefa Concluída',                 'Conclua uma tarefa doméstica ou escolar aprovada pelo responsável do clã.',                              'MONTHLY', 50,  1, 1),
      (UUID(), 'once_first_recipe',      'Primeira Receita da Família',      'Cadastre a primeira receita do seu clã e comece o livro de receitas da família.',                       'ONCE',    100, 1, 1),
      (UUID(), 'monthly_spend_under_80', 'Controle Financeiro',              'Gaste menos de 80% da sua renda mensal e mantenha um colchão financeiro saudável.',                     'MONTHLY', 150, 1, 1),
      (UUID(), 'monthly_spend_under_60', 'Poupador Dedicado',                'Gaste menos de 60% da sua renda mensal e acelere seus objetivos financeiros.',                          'MONTHLY', 250, 1, 1),
      (UUID(), 'monthly_spend_under_50', 'Mestre das Finanças',              'Gaste menos de 50% da sua renda mensal e entre para o hall dos grandes poupadores do clã.',             'MONTHLY', 400, 1, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user_mission_progress\` DROP FOREIGN KEY \`FK_user_mission_progress_definition\``);
    await queryRunner.query(`ALTER TABLE \`user_mission_progress\` DROP FOREIGN KEY \`FK_user_mission_progress_user\``);
    await queryRunner.query(`DROP TABLE \`user_mission_progress\``);
    await queryRunner.query(`DROP TABLE \`mission_definition\``);
  }
}
