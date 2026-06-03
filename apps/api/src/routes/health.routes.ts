import { Router } from "express";
import { prisma } from "../config/database";
import { redis } from "../config/redis";

const router = Router();

// GET /health - full health check (DB + Redis)
router.get("/health", async (_req, res) => {
  const checks = {
    api: "ok",
    database: "ok",
    redis: "ok",
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
  } catch {
    checks.redis = "error";
  }

  const healthy = checks.database === "ok" && checks.redis === "ok";
  res.status(healthy ? 200 : 503).json(checks);
});

export { router as healthRoutes };
