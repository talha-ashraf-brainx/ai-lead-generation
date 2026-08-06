import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameSendgridToResend1785848000000 implements MigrationInterface {
  name = "RenameSendgridToResend1785848000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "api_key_credentials_provider_enum" RENAME VALUE 'sendgrid' TO 'resend'`);
    await queryRunner.renameColumn("campaign_sends", "sendgridMessageId", "resendMessageId");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn("campaign_sends", "resendMessageId", "sendgridMessageId");
    await queryRunner.query(`ALTER TYPE "api_key_credentials_provider_enum" RENAME VALUE 'resend' TO 'sendgrid'`);
  }
}
