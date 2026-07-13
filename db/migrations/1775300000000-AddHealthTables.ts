import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthTables1775300000000 implements MigrationInterface {
  name = 'AddHealthTables1775300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`health_exam\` (
        \`id\` varchar(36) NOT NULL,
        \`labName\` varchar(255) NULL,
        \`doctorName\` varchar(255) NULL,
        \`examDate\` date NULL,
        \`examType\` enum('LABORATORY','IMAGING','FUNCTIONAL','PROCEDURE','OTHER') NOT NULL DEFAULT 'OTHER',
        \`sourceType\` enum('MANUAL','PDF','IMAGE_FILE') NOT NULL DEFAULT 'MANUAL',
        \`status\` enum('PENDING_REVIEW','APPROVED') NOT NULL DEFAULT 'APPROVED',
        \`notes\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`familyGroupId\` varchar(36) NULL,
        \`userId\` varchar(36) NULL,
        \`createdByUserId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_exam_item\` (
        \`id\` varchar(36) NOT NULL,
        \`itemName\` varchar(255) NOT NULL,
        \`material\` varchar(255) NULL,
        \`method\` varchar(255) NULL,
        \`resultValue\` text NULL,
        \`resultUnit\` varchar(100) NULL,
        \`referenceRange\` varchar(255) NULL,
        \`isAbnormal\` tinyint NOT NULL DEFAULT '0',
        \`findings\` text NULL,
        \`conclusion\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`examId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_exam_file\` (
        \`id\` varchar(36) NOT NULL,
        \`fileUrl\` varchar(500) NOT NULL,
        \`fileType\` enum('PDF','IMAGE') NOT NULL DEFAULT 'PDF',
        \`originalFilename\` varchar(500) NULL,
        \`pageCount\` int NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`examId\` varchar(36) NULL,
        \`processingId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_exam_processing\` (
        \`id\` varchar(36) NOT NULL,
        \`fileUrl\` varchar(500) NOT NULL,
        \`fileType\` enum('PDF','IMAGE') NOT NULL DEFAULT 'PDF',
        \`originalFilename\` varchar(500) NULL,
        \`totalPages\` int NULL DEFAULT '0',
        \`currentPage\` int NOT NULL DEFAULT '0',
        \`status\` enum('QUEUED','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED',
        \`extractedData\` json NULL,
        \`errorMessage\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`familyGroupId\` varchar(36) NULL,
        \`uploadedByUserId\` varchar(36) NULL,
        \`targetUserId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_prescription\` (
        \`id\` varchar(36) NOT NULL,
        \`doctorName\` varchar(255) NOT NULL,
        \`prescriptionDate\` date NOT NULL,
        \`notes\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`familyGroupId\` varchar(36) NULL,
        \`userId\` varchar(36) NULL,
        \`createdByUserId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_prescription_item\` (
        \`id\` varchar(36) NOT NULL,
        \`medicationName\` varchar(255) NOT NULL,
        \`dosage\` varchar(255) NULL,
        \`scheduleTimes\` json NULL,
        \`daysOfWeek\` json NULL,
        \`startDate\` date NULL,
        \`endDate\` date NULL,
        \`notes\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`prescriptionId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`health_ai_overview\` (
        \`id\` varchar(36) NOT NULL,
        \`reportContent\` longtext NOT NULL,
        \`generatedAt\` datetime NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`familyGroupId\` varchar(36) NULL,
        \`userId\` varchar(36) NULL,
        \`generatedByUserId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // Foreign keys — health_exam
    await queryRunner.query(
      `ALTER TABLE \`health_exam\` ADD CONSTRAINT \`FK_health_exam_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam\` ADD CONSTRAINT \`FK_health_exam_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam\` ADD CONSTRAINT \`FK_health_exam_created_by\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_exam_item
    await queryRunner.query(
      `ALTER TABLE \`health_exam_item\` ADD CONSTRAINT \`FK_health_exam_item_exam\` FOREIGN KEY (\`examId\`) REFERENCES \`health_exam\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_exam_file
    await queryRunner.query(
      `ALTER TABLE \`health_exam_file\` ADD CONSTRAINT \`FK_health_exam_file_exam\` FOREIGN KEY (\`examId\`) REFERENCES \`health_exam\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam_file\` ADD CONSTRAINT \`FK_health_exam_file_processing\` FOREIGN KEY (\`processingId\`) REFERENCES \`health_exam_processing\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_exam_processing
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` ADD CONSTRAINT \`FK_health_processing_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` ADD CONSTRAINT \`FK_health_processing_uploaded_by\` FOREIGN KEY (\`uploadedByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_exam_processing\` ADD CONSTRAINT \`FK_health_processing_target_user\` FOREIGN KEY (\`targetUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_prescription
    await queryRunner.query(
      `ALTER TABLE \`health_prescription\` ADD CONSTRAINT \`FK_health_prescription_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_prescription\` ADD CONSTRAINT \`FK_health_prescription_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_prescription\` ADD CONSTRAINT \`FK_health_prescription_created_by\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_prescription_item
    await queryRunner.query(
      `ALTER TABLE \`health_prescription_item\` ADD CONSTRAINT \`FK_health_prescription_item_rx\` FOREIGN KEY (\`prescriptionId\`) REFERENCES \`health_prescription\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — health_ai_overview
    await queryRunner.query(
      `ALTER TABLE \`health_ai_overview\` ADD CONSTRAINT \`FK_health_ai_overview_family_group\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_ai_overview\` ADD CONSTRAINT \`FK_health_ai_overview_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`health_ai_overview\` ADD CONSTRAINT \`FK_health_ai_overview_generated_by\` FOREIGN KEY (\`generatedByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Indexes
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_exam_family_user\` ON \`health_exam\` (\`familyGroupId\`, \`userId\`, \`deletedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_exam_date\` ON \`health_exam\` (\`examDate\`, \`deletedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_processing_status\` ON \`health_exam_processing\` (\`familyGroupId\`, \`status\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_prescription_user\` ON \`health_prescription\` (\`familyGroupId\`, \`userId\`, \`deletedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_exam_item_exam\` ON \`health_exam_item\` (\`examId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_health_ai_overview_user_date\` ON \`health_ai_overview\` (\`userId\`, \`generatedAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_health_ai_overview_user_date\` ON \`health_ai_overview\``);
    await queryRunner.query(`DROP INDEX \`IDX_health_exam_item_exam\` ON \`health_exam_item\``);
    await queryRunner.query(`DROP INDEX \`IDX_health_prescription_user\` ON \`health_prescription\``);
    await queryRunner.query(`DROP INDEX \`IDX_health_processing_status\` ON \`health_exam_processing\``);
    await queryRunner.query(`DROP INDEX \`IDX_health_exam_date\` ON \`health_exam\``);
    await queryRunner.query(`DROP INDEX \`IDX_health_exam_family_user\` ON \`health_exam\``);

    await queryRunner.query(`ALTER TABLE \`health_ai_overview\` DROP FOREIGN KEY \`FK_health_ai_overview_generated_by\``);
    await queryRunner.query(`ALTER TABLE \`health_ai_overview\` DROP FOREIGN KEY \`FK_health_ai_overview_user\``);
    await queryRunner.query(`ALTER TABLE \`health_ai_overview\` DROP FOREIGN KEY \`FK_health_ai_overview_family_group\``);
    await queryRunner.query(`ALTER TABLE \`health_prescription_item\` DROP FOREIGN KEY \`FK_health_prescription_item_rx\``);
    await queryRunner.query(`ALTER TABLE \`health_prescription\` DROP FOREIGN KEY \`FK_health_prescription_created_by\``);
    await queryRunner.query(`ALTER TABLE \`health_prescription\` DROP FOREIGN KEY \`FK_health_prescription_user\``);
    await queryRunner.query(`ALTER TABLE \`health_prescription\` DROP FOREIGN KEY \`FK_health_prescription_family_group\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_processing\` DROP FOREIGN KEY \`FK_health_processing_target_user\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_processing\` DROP FOREIGN KEY \`FK_health_processing_uploaded_by\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_processing\` DROP FOREIGN KEY \`FK_health_processing_family_group\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_file\` DROP FOREIGN KEY \`FK_health_exam_file_processing\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_file\` DROP FOREIGN KEY \`FK_health_exam_file_exam\``);
    await queryRunner.query(`ALTER TABLE \`health_exam_item\` DROP FOREIGN KEY \`FK_health_exam_item_exam\``);
    await queryRunner.query(`ALTER TABLE \`health_exam\` DROP FOREIGN KEY \`FK_health_exam_created_by\``);
    await queryRunner.query(`ALTER TABLE \`health_exam\` DROP FOREIGN KEY \`FK_health_exam_user\``);
    await queryRunner.query(`ALTER TABLE \`health_exam\` DROP FOREIGN KEY \`FK_health_exam_family_group\``);

    await queryRunner.query(`DROP TABLE \`health_ai_overview\``);
    await queryRunner.query(`DROP TABLE \`health_prescription_item\``);
    await queryRunner.query(`DROP TABLE \`health_prescription\``);
    await queryRunner.query(`DROP TABLE \`health_exam_processing\``);
    await queryRunner.query(`DROP TABLE \`health_exam_file\``);
    await queryRunner.query(`DROP TABLE \`health_exam_item\``);
    await queryRunner.query(`DROP TABLE \`health_exam\``);
  }
}
