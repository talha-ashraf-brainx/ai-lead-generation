import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class InitCampaigns1785844000000 implements MigrationInterface {
  name = "InitCampaigns1785844000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "campaigns",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "name", type: "varchar" },
          {
            name: "status",
            type: "enum",
            enumName: "campaigns_status_enum",
            enum: ["draft", "sending", "active", "completed"],
            default: "'draft'",
          },
          {
            name: "schedule",
            type: "enum",
            enumName: "campaigns_schedule_enum",
            enum: ["immediate", "scheduled"],
            default: "'immediate'",
          },
          { name: "scheduledAt", type: "timestamptz", isNullable: true },
          { name: "followUpDay3Enabled", type: "boolean", default: true },
          { name: "followUpDay3Subject", type: "varchar" },
          { name: "followUpDay3Body", type: "text" },
          { name: "followUpDay7Enabled", type: "boolean", default: true },
          { name: "followUpDay7Subject", type: "varchar" },
          { name: "followUpDay7Body", type: "text" },
          { name: "createdAt", type: "timestamptz", default: "now()" },
          { name: "sentAt", type: "timestamptz", isNullable: true },
        ],
      }),
    );

    // Deferred from Phase 2 (InitLeads): the campaigns table didn't exist yet, so
    // leads.campaignId shipped without a formal constraint. Adding it now.
    await queryRunner.createForeignKey(
      "leads",
      new TableForeignKey({
        name: "fk_leads_campaign",
        columnNames: ["campaignId"],
        referencedTableName: "campaigns",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "campaign_sends",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "campaignId", type: "uuid" },
          { name: "leadId", type: "uuid" },
          { name: "stage", type: "enum", enumName: "campaign_sends_stage_enum", enum: ["initial", "day3", "day7"] },
          {
            name: "status",
            type: "enum",
            enumName: "campaign_sends_status_enum",
            enum: ["queued", "sent", "delivered", "opened", "clicked", "bounced", "failed", "skipped"],
            default: "'queued'",
          },
          { name: "subject", type: "varchar" },
          { name: "body", type: "text" },
          { name: "sendgridMessageId", type: "varchar", isNullable: true },
          { name: "scheduledAt", type: "timestamptz", isNullable: true },
          { name: "sentAt", type: "timestamptz", isNullable: true },
          { name: "openedAt", type: "timestamptz", isNullable: true },
          { name: "clickedAt", type: "timestamptz", isNullable: true },
          { name: "bouncedAt", type: "timestamptz", isNullable: true },
          { name: "errorMessage", type: "varchar", isNullable: true },
          { name: "createdAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "campaign_sends",
      new TableForeignKey({
        name: "fk_campaign_sends_campaign",
        columnNames: ["campaignId"],
        referencedTableName: "campaigns",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
    await queryRunner.createForeignKey(
      "campaign_sends",
      new TableForeignKey({
        name: "fk_campaign_sends_lead",
        columnNames: ["leadId"],
        referencedTableName: "leads",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
    await queryRunner.createIndex(
      "campaign_sends",
      new TableIndex({ name: "idx_campaign_sends_unique_stage", columnNames: ["campaignId", "leadId", "stage"], isUnique: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("campaign_sends");
    await queryRunner.dropForeignKey("leads", "fk_leads_campaign");
    await queryRunner.dropTable("campaigns");
  }
}
