import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitEmailDrafts1785843000000 implements MigrationInterface {
  name = "InitEmailDrafts1785843000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "email_drafts",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "leadId", type: "uuid", isUnique: true },
          { name: "subject", type: "varchar" },
          { name: "body", type: "text" },
          {
            name: "status",
            type: "enum",
            enumName: "email_drafts_status_enum",
            enum: ["draft", "edited", "approved"],
            default: "'draft'",
          },
          { name: "personalization", type: "jsonb", default: "'[]'" },
          { name: "generatedAt", type: "timestamptz", default: "now()" },
          { name: "editedAt", type: "timestamptz", isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "email_drafts",
      new TableForeignKey({
        name: "fk_email_drafts_lead",
        columnNames: ["leadId"],
        referencedTableName: "leads",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("email_drafts", "fk_email_drafts_lead");
    await queryRunner.dropTable("email_drafts");
  }
}
