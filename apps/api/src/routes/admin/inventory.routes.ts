import { Router } from "express";
import { inventoryService } from "../../services/inventory.service";
import { stockService } from "../../services/stock.service";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

// GET /api/admin/inventory/counts - cho dashboard widget + sidebar badge
router.get("/counts", async (_req, res, next) => {
  try {
    const data = await inventoryService.getCounts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory/low-stock
router.get("/low-stock", async (req, res, next) => {
  try {
    const threshold = req.query.threshold
      ? Number(req.query.threshold)
      : undefined;
    const data = await inventoryService.getLowStockVariants(threshold);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory/out-of-stock
router.get("/out-of-stock", async (_req, res, next) => {
  try {
    const data = await inventoryService.getOutOfStockVariants();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/inventory/variant/:id
router.patch("/variant/:id", async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      throw new AppError("Stock khÃ´ng há»£p lá»‡", 400);
    }
    const variant = await inventoryService.updateVariantStock(
      req.params.id,
      Number(stock)
    );
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/inventory/bulk-update
router.post("/bulk-update", async (req, res, next) => {
  try {
    const updates = req.body as { variantId: string; stock: number }[];
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError("Cáº§n Ã­t nháº¥t 1 update", 400);
    }
    const results = await inventoryService.bulkUpdateStock(updates);
    res.json({ success: true, data: { updated: results.length } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory/defective-stock
router.get("/defective-stock", async (req, res, next) => {
  try {
    const data = await inventoryService.getDefectiveVariants();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory/disposal-history
router.get("/disposal-history", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const result = await inventoryService.getDisposalHistory(page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/inventory/variant/:id/dispose
router.patch("/variant/:id/dispose", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;
    if (!quantity || quantity <= 0) {
      throw new AppError("Số lượng tiêu hủy không hợp lệ", 400);
    }
    
    // using Prisma transaction since stockService expects one
    await prisma.$transaction(async (tx) => {
      await stockService.disposeDefectiveStock(tx, id, quantity, note);
    });

    res.json({ success: true, message: "Đã tiêu hủy hàng lỗi thành công" });
  } catch (err) {
    next(err);
  }
});

export { router as adminInventoryRoutes };