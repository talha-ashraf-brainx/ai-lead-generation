import { AppDataSource } from "../lib/dataSource.js";

async function main() {
  await AppDataSource.initialize();
  const executed = await AppDataSource.runMigrations();
  console.log(executed.length ? `Applied: ${executed.map((m) => m.name).join(", ")}` : "Already up to date.");
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
