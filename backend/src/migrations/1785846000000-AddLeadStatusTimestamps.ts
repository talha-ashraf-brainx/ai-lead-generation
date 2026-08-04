import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLeadStatusTimestamps1785846000000 implements MigrationInterface {
  name = "AddLeadStatusTimestamps1785846000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("leads", [
      new TableColumn({ name: "openedAt", type: "timestamptz", isNullable: true }),
      new TableColumn({ name: "repliedAt", type: "timestamptz", isNullable: true }),
      new TableColumn({ name: "convertedAt", type: "timestamptz", isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns("leads", ["openedAt", "repliedAt", "convertedAt"]);
  }
}
