import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFamilyGroupImage1776100000000 implements MigrationInterface {
  name = 'AddFamilyGroupImage1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`family_group\` ADD \`coatOfArms\` varchar(255) NOT NULL DEFAULT '/assets/images/brasao/brasao-1.png'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_group\` ADD \`groupImage\` varchar(255) NULL`,
    );
    // Grupos existentes herdam o brasão do owner para manter o visual atual.
    await queryRunner.query(`
      UPDATE \`family_group\` \`fg\`
      INNER JOIN \`user\` \`u\` ON \`u\`.\`id\` = \`fg\`.\`ownerId\`
      SET \`fg\`.\`coatOfArms\` = \`u\`.\`coatOfArms\`
      WHERE \`u\`.\`coatOfArms\` IS NOT NULL AND \`u\`.\`coatOfArms\` <> ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`family_group\` DROP COLUMN \`groupImage\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_group\` DROP COLUMN \`coatOfArms\``,
    );
  }
}
