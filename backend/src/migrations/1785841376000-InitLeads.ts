import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class InitLeads1785841376000 implements MigrationInterface {
  name = "InitLeads1785841376000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "leads",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "company", type: "varchar" },
          { name: "contactName", type: "varchar" },
          { name: "email", type: "varchar", isNullable: true },
          { name: "website", type: "varchar", default: "''" },
          { name: "industry", type: "varchar" },
          {
            name: "status",
            type: "enum",
            enumName: "leads_status_enum",
            enum: ["contacted", "opened", "replied", "converted"],
            default: "'contacted'",
          },
          {
            name: "enrichment",
            type: "enum",
            enumName: "leads_enrichment_enum",
            enum: ["pending", "enriched", "failed"],
            default: "'pending'",
          },
          { name: "campaignId", type: "uuid", isNullable: true },
          { name: "campaignName", type: "varchar", isNullable: true },
          { name: "painPoint", type: "varchar", isNullable: true },
          {
            name: "source",
            type: "enum",
            enumName: "leads_source_enum",
            enum: ["csv", "search"],
          },
          { name: "createdAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );

    await queryRunner.createIndex(
      "leads",
      new TableIndex({ name: "idx_leads_email", columnNames: ["email"] }),
    );

    await queryRunner.createTable(
      new Table({
        name: "lead_import_jobs",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "niche", type: "varchar" },
          { name: "location", type: "varchar" },
          {
            name: "status",
            type: "enum",
            enumName: "lead_import_jobs_status_enum",
            enum: ["processing", "completed", "failed"],
            default: "'processing'",
          },
          { name: "importedCount", type: "int", default: 0 },
          { name: "duplicateCount", type: "int", default: 0 },
          { name: "errorCount", type: "int", default: 0 },
          { name: "errorMessage", type: "varchar", isNullable: true },
          { name: "createdAt", type: "timestamptz", default: "now()" },
          { name: "completedAt", type: "timestamptz", isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("lead_import_jobs");
    await queryRunner.dropTable("leads");
  }
}
