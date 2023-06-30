import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayment1688161942870 implements MigrationInterface {
  name = 'CreatePayment1688161942870';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`payment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD \`payment_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon\` ADD CONSTRAINT \`FK_dd06e2d16e22cfa4e6e8f1e82cf\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coupon\` DROP FOREIGN KEY \`FK_dd06e2d16e22cfa4e6e8f1e82cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coupon\` DROP COLUMN \`payment_id\``,
    );
    await queryRunner.query(`DROP TABLE \`payment\``);
  }
}
