import { MigrationInterface, QueryRunner } from "typeorm";

// Split from the migration that sets this as the column default (1785850000000) —
// Postgres won't let a transaction use an enum value it added itself
// ("New enum values must be committed before they can be used"), so the ADD VALUE
// has to land and commit in its own migration run first.
export class AddNewLeadStatusEnumValue1785849000000 implements MigrationInterface {
  name = "AddNewLeadStatusEnumValue1785849000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "leads_status_enum" ADD VALUE 'new' BEFORE 'contacted'`);
  }

  public async down(): Promise<void> {
    // No-op: the follow-up migration's down() rebuilds the enum type without 'new'.
  }
}
