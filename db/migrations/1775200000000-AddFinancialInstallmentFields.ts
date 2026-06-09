import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinancialInstallmentFields1775200000000
  implements MigrationInterface
{
  name = 'AddFinancialInstallmentFields1775200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`expense\`
        ADD COLUMN \`installmentGroupId\` varchar(36) NULL,
        ADD COLUMN \`installmentNumber\` int NULL,
        ADD COLUMN \`totalInstallments\` int NULL,
        ADD COLUMN \`isInstallment\` tinyint NOT NULL DEFAULT 0,
        ADD COLUMN \`photos\` json NOT NULL DEFAULT ('[]')
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_expense_installmentGroupId\` ON \`expense\` (\`installmentGroupId\`)
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_expense_isInstallment\` ON \`expense\` (\`isInstallment\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`revenue\`
        ADD COLUMN \`installmentGroupId\` varchar(36) NULL,
        ADD COLUMN \`installmentNumber\` int NULL,
        ADD COLUMN \`totalInstallments\` int NULL,
        ADD COLUMN \`isInstallment\` tinyint NOT NULL DEFAULT 0,
        ADD COLUMN \`photos\` json NOT NULL DEFAULT ('[]')
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_revenue_installmentGroupId\` ON \`revenue\` (\`installmentGroupId\`)
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_revenue_isInstallment\` ON \`revenue\` (\`isInstallment\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`item\`
        ADD COLUMN \`warrantyDuration\` int NULL,
        ADD COLUMN \`warrantyUnit\` varchar(16) NULL,
        ADD COLUMN \`warrantyExpiresAt\` datetime NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`item\`
        DROP COLUMN \`warrantyExpiresAt\`,
        DROP COLUMN \`warrantyUnit\`,
        DROP COLUMN \`warrantyDuration\`
    `);

    await queryRunner.query(
      `DROP INDEX \`IDX_revenue_isInstallment\` ON \`revenue\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_revenue_installmentGroupId\` ON \`revenue\``,
    );
    await queryRunner.query(`
      ALTER TABLE \`revenue\`
        DROP COLUMN \`photos\`,
        DROP COLUMN \`isInstallment\`,
        DROP COLUMN \`totalInstallments\`,
        DROP COLUMN \`installmentNumber\`,
        DROP COLUMN \`installmentGroupId\`
    `);

    await queryRunner.query(
      `DROP INDEX \`IDX_expense_isInstallment\` ON \`expense\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_expense_installmentGroupId\` ON \`expense\``,
    );
    await queryRunner.query(`
      ALTER TABLE \`expense\`
        DROP COLUMN \`photos\`,
        DROP COLUMN \`isInstallment\`,
        DROP COLUMN \`totalInstallments\`,
        DROP COLUMN \`installmentNumber\`,
        DROP COLUMN \`installmentGroupId\`
    `);
  }
}
