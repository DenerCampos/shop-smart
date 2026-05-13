import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChoreTables1774750000000 implements MigrationInterface {
  name = 'AddChoreTables1774750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`chore_definition\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`rewardValue\` decimal(16,2) NOT NULL DEFAULT '0.00', \`coinReward\` int NOT NULL DEFAULT '0', \`requirePhoto\` tinyint NOT NULL DEFAULT '0', \`recurrence\` enum ('once','daily','weekly') NOT NULL DEFAULT 'once', \`isActive\` tinyint NOT NULL DEFAULT '1', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`familyGroupId\` varchar(36) NULL, \`createdByUserId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chore_payroll_settlement\` (\`id\` varchar(36) NOT NULL, \`periodYm\` int NOT NULL, \`settledAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`familyGroupId\` varchar(36) NULL, \`settledByUserId\` varchar(36) NULL, UNIQUE INDEX \`IDX_family_period_ym_unique\` (\`familyGroupId\`, \`periodYm\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chore_payroll_line\` (\`id\` varchar(36) NOT NULL, \`amountMoney\` decimal(16,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`payrollSettlementId\` varchar(36) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chore_occurrence\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('open','in_progress','waiting_approval','completed','rejected') NOT NULL, \`snapshotRewardMoney\` decimal(16,2) NULL, \`snapshotCoinReward\` int NULL, \`photoBeforeUrl\` varchar(255) NULL, \`photoAfterUrl\` varchar(255) NULL, \`rejectionReason\` text NULL, \`submittedAt\` datetime NULL, \`approvedAt\` datetime NULL, \`completedAt\` datetime NULL, \`earnedPeriodYm\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`choreDefinitionId\` varchar(36) NULL, \`familyGroupId\` varchar(36) NULL, \`assignedToUserId\` varchar(36) NULL, \`approvedByUserId\` varchar(36) NULL, \`payrollSettlementId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_definition\` ADD CONSTRAINT \`FK_chore_definition_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_definition\` ADD CONSTRAINT \`FK_chore_definition_created_by\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_settlement\` ADD CONSTRAINT \`FK_chore_payroll_settlement_fg\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_settlement\` ADD CONSTRAINT \`FK_chore_payroll_settlement_user\` FOREIGN KEY (\`settledByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_line\` ADD CONSTRAINT \`FK_chore_payroll_line_settlement\` FOREIGN KEY (\`payrollSettlementId\`) REFERENCES \`chore_payroll_settlement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_line\` ADD CONSTRAINT \`FK_chore_payroll_line_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD CONSTRAINT \`FK_chore_occurrence_definition\` FOREIGN KEY (\`choreDefinitionId\`) REFERENCES \`chore_definition\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD CONSTRAINT \`FK_chore_occurrence_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD CONSTRAINT \`FK_chore_occurrence_assigned\` FOREIGN KEY (\`assignedToUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD CONSTRAINT \`FK_chore_occurrence_approved_by\` FOREIGN KEY (\`approvedByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD CONSTRAINT \`FK_chore_occurrence_payroll\` FOREIGN KEY (\`payrollSettlementId\`) REFERENCES \`chore_payroll_settlement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX \`IDX_chore_occurrence_family_status\` ON \`chore_occurrence\` (\`familyGroupId\`, \`status\`, \`deletedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_chore_occurrence_assignee_payroll\` ON \`chore_occurrence\` (\`assignedToUserId\`, \`earnedPeriodYm\`, \`payrollSettlementId\`, \`status\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_chore_definition_family\` ON \`chore_definition\` (\`familyGroupId\`, \`deletedAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_chore_definition_family\` ON \`chore_definition\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_chore_occurrence_assignee_payroll\` ON \`chore_occurrence\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_chore_occurrence_family_status\` ON \`chore_occurrence\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP FOREIGN KEY \`FK_chore_occurrence_payroll\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP FOREIGN KEY \`FK_chore_occurrence_approved_by\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP FOREIGN KEY \`FK_chore_occurrence_assigned\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP FOREIGN KEY \`FK_chore_occurrence_family_group\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP FOREIGN KEY \`FK_chore_occurrence_definition\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_line\` DROP FOREIGN KEY \`FK_chore_payroll_line_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_line\` DROP FOREIGN KEY \`FK_chore_payroll_line_settlement\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_settlement\` DROP FOREIGN KEY \`FK_chore_payroll_settlement_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_payroll_settlement\` DROP FOREIGN KEY \`FK_chore_payroll_settlement_fg\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`chore_definition\` DROP FOREIGN KEY \`FK_chore_definition_created_by\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chore_definition\` DROP FOREIGN KEY \`FK_chore_definition_family_group\``,
    );

    await queryRunner.query(`DROP TABLE \`chore_occurrence\``);
    await queryRunner.query(`DROP TABLE \`chore_payroll_line\``);
    await queryRunner.query(`DROP TABLE \`chore_payroll_settlement\``);
    await queryRunner.query(`DROP TABLE \`chore_definition\``);
  }
}
