import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLeadEnrichmentTracking1785842200000 implements MigrationInterface {
  name = "AddLeadEnrichmentTracking1785842200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("leads", [
      new TableColumn({ name: "enrichmentAttempts", type: "int", default: 0 }),
      new TableColumn({ name: "enrichmentError", type: "varchar", isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns("leads", ["enrichmentAttempts", "enrichmentError"]);
  }
}
