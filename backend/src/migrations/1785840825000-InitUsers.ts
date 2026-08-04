import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitUsers1785840825000 implements MigrationInterface {
  name = "InitUsers1785840825000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "gen_random_uuid()" },
          { name: "email", type: "varchar", isUnique: true },
          { name: "passwordHash", type: "varchar" },
          { name: "name", type: "varchar", isNullable: true },
          { name: "resetTokenHash", type: "varchar", isNullable: true },
          { name: "resetTokenExpiresAt", type: "timestamptz", isNullable: true },
          { name: "createdAt", type: "timestamptz", default: "now()" },
          { name: "updatedAt", type: "timestamptz", default: "now()" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
  }
}
