import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { shippingService } from "../services/shipping.service";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

// GET /api/shipping/provinces
router.get("/provinces", async (_req, res, next) => {
  try {
    const data = await shippingService.getProvinces();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipping/districts?provinceId=
router.get("/districts", async (req, res, next) => {
  try {
    const provinceId = Number(req.query.provinceId);
    if (!provinceId) throw new AppError("Thiếu provinceId", 400);
    const data = await shippingService.getDistricts(provinceId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipping/wards?districtId=
router.get("/wards", async (req, res, next) => {
  try {
    const districtId = Number(req.query.districtId);
    if (!districtId) throw new AppError("Thiếu districtId", 400);
    const data = await shippingService.getWards(districtId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

const calcSchema = z.object({
  toDistrictId: z.number().int().optional(),
  toWardCode: z.string().optional(),
  weight: z.number().int().min(50).optional(),
  orderValue: z.number().int().min(0).optional(),
});

// POST /api/shipping/calculate-fee
router.post("/calculate-fee", async (req, res, next) => {
  try {
    const data = calcSchema.parse(req.body);
    const result = await shippingService.calculateFee(data);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// POST /api/shipping/ghn-webhook - GHN callback khi đổi trạng thái
router.post("/ghn-webhook", async (req, res, next) => {
  try {
    const { OrderCode, Status, ClientOrderCode } = req.body;
    if (!OrderCode || !Status) {
      return res.json({ message: "missing data" });
    }

    const code = ClientOrderCode || undefined;
    const order = code
      ? await prisma.order.findUnique({ where: { code } })
      : await prisma.order.findFirst({ where: { ghnOrderCode: OrderCode } });

    if (!order) return res.json({ message: "order not found" });

    // Map GHN status → app status
    const statusMap: Record<string, string> = {
      delivered: "DELIVERED",
      delivering: "SHIPPING",
      picked: "SHIPPING",
      cancel: "CANCELLED",
      return: "CANCELLED",
    };
    const newStatus = statusMap[Status];
    if (newStatus && newStatus !== order.status) {
      const updateData: any = { status: newStatus };
      if (newStatus === "DELIVERED") {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = "PAID";
        updateData.paidAt = new Date();
      }
      await prisma.order.update({ where: { id: order.id }, data: updateData });
    }

    res.json({ message: "ok" });
  } catch (err) {
    console.error("[GHN webhook]", err);
    next(err);
  }
});

export { router as shippingRoutes };
