import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  res.json({ success: true, data: [] });
});

export { router as adminReviewRoutes };