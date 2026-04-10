import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShoppingListTables1774557173946 implements MigrationInterface {
    name = 'AddShoppingListTables1774557173946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`shopping_list_item\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`quantity\` float NOT NULL DEFAULT '1', \`unit\` enum ('un', 'kg', 'g', 'l', 'ml', 'pack', 'dz') NOT NULL DEFAULT 'un', \`status\` enum ('pending', 'in_cart') NOT NULL DEFAULT 'pending', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`shoppingListId\` varchar(36) NULL, \`addedById\` varchar(36) NULL, \`checkedById\` varchar(36) NULL, \`groupId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shopping_list\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('active', 'completed', 'archived') NOT NULL DEFAULT 'active', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`familyGroupId\` varchar(36) NULL, \`createdById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`alexaToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e3c1c267d035496a583b57b5d0\` (\`alexaToken\`)`);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` ADD CONSTRAINT \`FK_033f63ed42e52b04a8c6cd4bde3\` FOREIGN KEY (\`shoppingListId\`) REFERENCES \`shopping_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` ADD CONSTRAINT \`FK_aa2e8f7cf9039f85c4ce8e31041\` FOREIGN KEY (\`addedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` ADD CONSTRAINT \`FK_23c0295b5a2e8f919c825fa2760\` FOREIGN KEY (\`checkedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` ADD CONSTRAINT \`FK_5a5b384b67010ff01f91fde3fc6\` FOREIGN KEY (\`groupId\`) REFERENCES \`group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_list\` ADD CONSTRAINT \`FK_e13b9461e3232a9295f634071bb\` FOREIGN KEY (\`familyGroupId\`) REFERENCES \`family_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_list\` ADD CONSTRAINT \`FK_30c14be5692c8a9d2f8e1807767\` FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX \`IDX_shopping_list_family_status\` ON \`shopping_list\` (\`familyGroupId\`, \`status\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_shopping_list_created_status\` ON \`shopping_list\` (\`createdById\`, \`status\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_shopping_list_item_list_status\` ON \`shopping_list_item\` (\`shoppingListId\`, \`status\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_shopping_list_item_list_status\` ON \`shopping_list_item\``);
        await queryRunner.query(`DROP INDEX \`IDX_shopping_list_created_status\` ON \`shopping_list\``);
        await queryRunner.query(`DROP INDEX \`IDX_shopping_list_family_status\` ON \`shopping_list\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list\` DROP FOREIGN KEY \`FK_30c14be5692c8a9d2f8e1807767\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list\` DROP FOREIGN KEY \`FK_e13b9461e3232a9295f634071bb\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` DROP FOREIGN KEY \`FK_5a5b384b67010ff01f91fde3fc6\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` DROP FOREIGN KEY \`FK_23c0295b5a2e8f919c825fa2760\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` DROP FOREIGN KEY \`FK_aa2e8f7cf9039f85c4ce8e31041\``);
        await queryRunner.query(`ALTER TABLE \`shopping_list_item\` DROP FOREIGN KEY \`FK_033f63ed42e52b04a8c6cd4bde3\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_e3c1c267d035496a583b57b5d0\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`alexaToken\``);
        await queryRunner.query(`DROP TABLE \`shopping_list\``);
        await queryRunner.query(`DROP TABLE \`shopping_list_item\``);
    }

}
