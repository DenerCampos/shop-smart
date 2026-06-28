import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthPatientContext1775400000000 implements MigrationInterface {
  name = 'AddHealthPatientContext1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`health_patient_context\` (
        \`id\` varchar(36) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`familyGroupId\` varchar(36) NULL,
        \`userId\` varchar(36) NULL,
        \`createdByUserId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\`
        ADD CONSTRAINT \`FK_health_patient_context_familyGroup\`
        FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\`
        ADD CONSTRAINT \`FK_health_patient_context_user\`
        FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\`
        ADD CONSTRAINT \`FK_health_patient_context_createdBy\`
        FOREIGN KEY (\`createdByUserId\`) REFERENCES \`user\`(\`id\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX \`IDX_health_patient_context_userId\`
        ON \`health_patient_context\` (\`userId\`)`,
    );

    await queryRunner.query(
      `CREATE INDEX \`IDX_health_patient_context_createdAt\`
        ON \`health_patient_context\` (\`createdAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\` DROP FOREIGN KEY \`FK_health_patient_context_createdBy\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\` DROP FOREIGN KEY \`FK_health_patient_context_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_patient_context\` DROP FOREIGN KEY \`FK_health_patient_context_familyGroup\``,
    );
    await queryRunner.query(`DROP TABLE \`health_patient_context\``);
  }
}
