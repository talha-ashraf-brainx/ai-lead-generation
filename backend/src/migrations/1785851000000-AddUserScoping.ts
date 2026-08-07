import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from "typeorm";

// Multi-tenancy: every data table gets a userId so one account can never read or write
// another's rows. Adds the column as NOT NULL with no backfill — safe here only because
// all data tables were intentionally emptied before this shipped (pre-deploy, Phase 10
// not started). Against a populated database this would need a nullable add → backfill
// → set-not-null sequence instead, since there'd be no correct owner to assume.
const SCOPED_TABLES = [
  "leads",
  "campaigns",
  "campaign_sends",
  "email_drafts",
  "lead_import_jobs",
  "notifications",
  "api_key_credentials",
  "notification_settings",
  "sender_identity",
] as const;

// One settings row per user rather than one globally.
const SINGLETON_PER_USER_TABLES = ["notification_settings", "sender_identity"] as const;

export class AddUserScoping1785851000000 implements MigrationInterface {
  name = "AddUserScoping1785851000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of SCOPED_TABLES) {
      const rowCount = Number((await queryRunner.query(`SELECT COUNT(*)::int AS count FROM "${table}"`))[0].count);
      if (rowCount > 0) {
        throw new Error(
          `Refusing to migrate: "${table}" has ${rowCount} row(s) and there is no correct userId to assign them. Clear the data tables first, or rewrite this migration to backfill.`,
        );
      }

      await queryRunner.addColumn(table, new TableColumn({ name: "userId", type: "uuid", isNullable: false }));

      await queryRunner.createForeignKey(
        table,
        new TableForeignKey({
          name: `fk_${table}_user`,
          columnNames: ["userId"],
          referencedTableName: "users",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE",
        }),
      );

      // Every scoped read filters on userId, so it carries the index rather than relying
      // on the FK (Postgres doesn't index the referencing side automatically).
      await queryRunner.createIndex(
        table,
        new TableIndex({ name: `idx_${table}_user`, columnNames: ["userId"] }),
      );
    }

    for (const table of SINGLETON_PER_USER_TABLES) {
      await queryRunner.createIndex(
        table,
        new TableIndex({ name: `uq_${table}_user`, columnNames: ["userId"], isUnique: true }),
      );
    }

    // api_key_credentials.provider was globally unique — now it's unique per user.
    await queryRunner.query(
      `ALTER TABLE "api_key_credentials" DROP CONSTRAINT IF EXISTS "UQ_2a70a4c0ffb1b6ee1b7d6d5a01a"`,
    );
    const providerConstraints = (await queryRunner.query(
      `SELECT con.conname AS name FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       WHERE rel.relname = 'api_key_credentials' AND con.contype = 'u'`,
    )) as { name: string }[];
    for (const { name } of providerConstraints) {
      await queryRunner.query(`ALTER TABLE "api_key_credentials" DROP CONSTRAINT "${name}"`);
    }
    await queryRunner.query(
      `ALTER TABLE "api_key_credentials" ADD CONSTRAINT "uq_api_key_credentials_user_provider" UNIQUE ("userId", "provider")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_key_credentials" DROP CONSTRAINT IF EXISTS "uq_api_key_credentials_user_provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key_credentials" ADD CONSTRAINT "uq_api_key_credentials_provider" UNIQUE ("provider")`,
    );

    for (const table of SINGLETON_PER_USER_TABLES) {
      await queryRunner.dropIndex(table, `uq_${table}_user`);
    }

    for (const table of SCOPED_TABLES) {
      await queryRunner.dropIndex(table, `idx_${table}_user`);
      await queryRunner.dropForeignKey(table, `fk_${table}_user`);
      await queryRunner.dropColumn(table, "userId");
    }
  }
}
