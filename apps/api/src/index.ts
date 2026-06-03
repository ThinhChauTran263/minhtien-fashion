import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { initSentry } from "./config/sentry";
import { redis } from "./config/redis";
import { closeQueues } from "./config/queue";
import { closeWorkers } from "./workers";
import "./jobs/inventory-check";
import "./jobs/reservation-release";
import "./jobs/abandoned-cart";

initSentry();

async function main() {
  await prisma.$connect();
  console.log("[DB] Connected to PostgreSQL");

  const server = app.listen(env.port, () => {
    console.log(`[Server] Minh Tien Fashion API running on port ${env.port}`);
    console.log(`[Server] Environment: ${env.nodeEnv}`);
  });

  async function shutdown(signal: string) {
    console.log(`[Server] ${signal} received, shutting down...`);
    server.close(async () => {
      await closeWorkers();
      await closeQueues();
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
