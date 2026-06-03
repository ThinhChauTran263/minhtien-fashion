import { Router } from "express";
import { z } from "zod";
import { sizeGuideService } from "../services/size-guide.service";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

const upsertSizeGuideValidator = z.object({
  body: z.object({
    categoryId: z.string().min(1).nullable().optional(),
    data: z.record(
      z.object({
        chest: z.coerce.number().min(0),
        length: z.coerce.number().min(0),
        shoulder: z.coerce.number().min(0),
        weight: z.string().min(1),
        height: z.string().min(1),
      })
    ),
  }),
});

router.get("/", async (req, res, next) => {
  try {
    const guide = await sizeGuideService.getSizeGuide(req.query.categoryId as string | undefined);
    res.json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
});

const adminRouter = Router();

adminRouter.put("/", validate(upsertSizeGuideValidator), async (req, res, next) => {
  try {
    const guide = await sizeGuideService.upsertSizeGuide(req.body.categoryId ?? null, req.body.data);
    res.json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
});

export { router as sizeGuideRoutes };
export { adminRouter as adminSizeGuideRoutes };
