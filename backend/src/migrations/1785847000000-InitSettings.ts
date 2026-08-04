import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitSettings1785847000000 implements MigrationInterface {
  name = "InitSettings1785847000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "api_key_credentials",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          {
            name: "provider",
            type: "enum",
            enumName: "api_key_credentials_provider_enum",
            enum: ["apollo", "hunter", "openai", "sendgrid"],
            isUnique: true,
          },
          { name: "encryptedValue", type: "text" },
          { name: "maskedValue", type: "varchar" },
          { name: "updatedAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "sender_identity",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "fromName", type: "varchar", default: "'Emberline Outreach'" },
          { name: "fromEmail", type: "varchar", default: "'outreach@emberline.io'" },
          { name: "smtpFallbackEnabled", type: "boolean", default: false },
          { name: "smtpHost", type: "varchar", default: "''" },
          { name: "smtpPort", type: "varchar", default: "''" },
          { name: "smtpUsername", type: "varchar", default: "''" },
          { name: "smtpPasswordEncrypted", type: "text" },
          { name: "updatedAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("sender_identity");
    await queryRunner.dropTable("api_key_credentials");
  }
}
