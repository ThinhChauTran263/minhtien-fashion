import { Router } from "express";
import { reportService } from "../../services/report.service";
import {
  buildRevenueExcel,
  buildOrdersExcel,
  buildProductSalesExcel,
} from "../../utils/excel";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

function parseRange(req: any) {
  const fromStr = req.query.from as string | undefined;
  const toStr = req.query.to as string | undefined;
  const to = toStr ? new Date(toStr) : new Date();
  const from = fromStr
    ? new Date(fromStr)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new AppError("Äá»‹nh dáº¡ng ngÃ y khÃ´ng há»£p lá»‡", 400);
  }
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

// GET /api/admin/reports/summary?from=&to=
router.get("/summary", async (req, res, next) => {
  try {
    const range = parseRange(req);
    const groupBy = (req.query.groupBy as any) || "day";
    const [summary, revenue, products] = await Promise.all([
      reportService.getSummary(range),
      reportService.getRevenueReport(range, groupBy),
      reportService.getProductSalesReport(range),
    ]);
    res.json({
      success: true,
      data: { summary, revenue, topProducts: products.slice(0, 10) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/revenue?from=&to=
router.get("/revenue", async (req, res, next) => {
  try {
    const groupBy = (req.query.groupBy as any) || "day";
    const data = await reportService.getRevenueReport(parseRange(req), groupBy);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/revenue/export
router.get("/revenue/export", async (req, res, next) => {
  try {
    const groupBy = (req.query.groupBy as any) || "day";
    const range = parseRange(req);
    const rows = await reportService.getRevenueReport(range, groupBy);
    const buffer = await buildRevenueExcel(rows);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-doanh-thu.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/orders/export?from=&to=&status=
router.get("/orders/export", async (req, res, next) => {
  try {
    const range = parseRange(req);
    const status = req.query.status as string | undefined;
    const orders = await reportService.getOrdersReport({ ...range, status });
    const buffer = await buildOrdersExcel(orders);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-don-hang.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/products/export
router.get("/products/export", async (req, res, next) => {
  try {
    const range = parseRange(req);
    const rows = await reportService.getProductSalesReport(range);
    const buffer = await buildProductSalesExcel(rows);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-san-pham-ban-chay.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export { router as adminReportRoutes };
