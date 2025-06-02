import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterColumsTransactionType1748627704322 implements MigrationInterface {
    name = 'AlterColumsTransactionType1748627704322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` CHANGE \`transaction_type\` \`transactionType\` enum ('earn', 'spend', 'bonus', 'penalty', 'refund') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_transaction\` CHANGE \`transactionType\` \`transaction_type\` enum ('earn', 'spend', 'bonus', 'penalty', 'refund') NOT NULL`);
    }

}
