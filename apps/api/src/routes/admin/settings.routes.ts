import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";

const router = Router();

const settingsSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

function parseSettingValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// GET /api/admin/settings
router.get("/", async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    const data = settings.reduce<Record<string, unknown>>((acc, setting) => {
      acc[setting.key] = parseSettingValue(setting.value);
      return acc;
    }, {});

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings
router.put("/", async (req, res, next) => {
  try {
    const payload = settingsSchema.parse(req.body);
    const entries = Object.entries(payload);

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        })
      )
    );

    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
});

export { router as adminSettingRoutes };
