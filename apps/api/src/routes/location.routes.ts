import { Router } from "express";
import { locationService } from "../services/location.service";

const router = Router();

router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q as string;
    const data = await locationService.search(q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/provinces", async (req, res, next) => {
  try {
    const data = await locationService.getProvinces();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/provinces/:id/wards", async (req, res, next) => {
  try {
    const provinceId = parseInt(req.params.id, 10);
    const data = await locationService.getWardsByProvince(provinceId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as locationRoutes };
