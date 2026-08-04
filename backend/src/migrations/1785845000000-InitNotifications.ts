import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitNotifications1785845000000 implements MigrationInterface {
  name = "InitNotifications1785845000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "notification_settings",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "slackEnabled", type: "boolean", default: false },
          { name: "slackWebhookUrl", type: "varchar", isNullable: true },
          { name: "emailAlertsEnabled", type: "boolean", default: true },
          { name: "updatedAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "notifications",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "kind", type: "enum", enumName: "notifications_kind_enum", enum: ["reply", "follow_up", "conversion"] },
          { name: "title", type: "varchar" },
          { name: "detail", type: "text" },
          { name: "leadId", type: "uuid", isNullable: true },
          { name: "campaignId", type: "uuid", isNullable: true },
          { name: "read", type: "boolean", default: false },
          { name: "createdAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );

    // SET NULL, not CASCADE — a notification is a historical record that should
    // survive deletion of the lead/campaign it references.
    await queryRunner.createForeignKey(
      "notifications",
      new TableForeignKey({
        name: "fk_notifications_lead",
        columnNames: ["leadId"],
        referencedTableName: "leads",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
    await queryRunner.createForeignKey(
      "notifications",
      new TableForeignKey({
        name: "fk_notifications_campaign",
        columnNames: ["campaignId"],
        referencedTableName: "campaigns",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("notifications");
    await queryRunner.dropTable("notification_settings");
  }
}
