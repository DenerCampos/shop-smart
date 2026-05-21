import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipeTable1774800000000 implements MigrationInterface {
  name = 'AddRecipeTable1774800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`recipe\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`ingredients\` json NOT NULL,
        \`instructions\` text NOT NULL,
        \`photos\` json NOT NULL DEFAULT ('[]'),
        \`familyGroupId\` varchar(36) NULL,
        \`createdById\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`recipe\`
      ADD CONSTRAINT \`FK_recipe_family_group\`
      FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`recipe\`
      ADD CONSTRAINT \`FK_recipe_created_by_user\`
      FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(
      `CREATE INDEX \`IDX_recipe_family_deleted\` ON \`recipe\` (\`familyGroupId\`, \`deletedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_recipe_created_deleted\` ON \`recipe\` (\`createdById\`, \`deletedAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_recipe_created_deleted\` ON \`recipe\``);
    await queryRunner.query(`DROP INDEX \`IDX_recipe_family_deleted\` ON \`recipe\``);
    await queryRunner.query(
      `ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_recipe_created_by_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_recipe_family_group\``,
    );
    await queryRunner.query(`DROP TABLE \`recipe\``);
  }
}
