import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTypeIdStoreTable1688564668290 implements MigrationInterface {
  name = 'AlterTypeIdStoreTable1688564668290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`store\` CHANGE \`id\` \`id\` int NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`store\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`store\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`,
    );
    await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`store_id\``);
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD \`store_id\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_a6b17d42c728b530202640aa3d7\``,
    );
    await queryRunner.query(`ALTER TABLE \`coupon\` DROP COLUMN \`store_id\``);
    await queryRunner.query(`ALTER TABLE \`coupon\` ADD \`store_id\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`store\` ADD \`id\` int NOT NULL AUTO_INCREMENT`,
    );
    await queryRunner.query(`ALTER TABLE \`store\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(
      `ALTER TABLE \`store\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_a6b17d42c728b530202640aa3d7\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
