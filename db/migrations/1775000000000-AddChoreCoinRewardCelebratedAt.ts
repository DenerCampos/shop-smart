import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChoreCoinRewardCelebratedAt1775000000000
  implements MigrationInterface
{
  name = 'AddChoreCoinRewardCelebratedAt1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` ADD \`coinRewardCelebratedAt\` datetime NULL`,
    );
    await queryRunner.query(
      `UPDATE \`chore_occurrence\` SET \`coinRewardCelebratedAt\` = \`approvedAt\` WHERE \`status\` = 'completed' AND \`approvedAt\` IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`chore_occurrence\` DROP COLUMN \`coinRewardCelebratedAt\``,
    );
  }
}
