// Must load before anything that touches TypeORM decorators (entities imported
// transitively via app.js's routes) or emitDecoratorMetadata has nothing to call into.
import "reflect-metadata";
import { createApp } from "./app.js";
import { startEmailWorker } from "./jobs/emailWorker.js";
import { AppDataSource } from "./lib/dataSource.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

async function main() {
  await AppDataSource.initialize();
  logger.info("Database connection established");

  // In-process worker — no separate worker deploy target until Phase 10.
  startEmailWorker();
  logger.info("Email send worker started");

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server", { error: err instanceof Error ? err.message : err });
  process.exitCode = 1;
});
