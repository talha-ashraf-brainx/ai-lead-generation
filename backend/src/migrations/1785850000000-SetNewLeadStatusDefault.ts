import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNewLeadStatusDefault1785850000000 implements MigrationInterface {
  name = "SetNewLeadStatusDefault1785850000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "leads" SET "status" = 'contacted' WHERE "status" = 'new'`);
    await queryRunner.query(`ALTER TYPE "leads_status_enum" RENAME TO "leads_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "leads_status_enum" AS ENUM('contacted', 'opened', 'replied', 'converted')`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "status" TYPE "leads_status_enum" USING "status"::text::"leads_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'contacted'`);
    await queryRunner.query(`DROP TYPE "leads_status_enum_old"`);
  }
}
