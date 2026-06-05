import { Router } from "express";
import { prisma } from "../../config/database";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";
import { adminProductRoutes } from "./products.routes";
import { adminOrderRoutes } from "./orders.routes";
import { adminVoucherRoutes } from "./vouchers.routes";
import { adminUserRoutes } from "./users.routes";
import { adminBannerRoutes } from "./banners.routes";
import { adminReviewRoutes } from "./reviews.routes";
import { adminFlashSaleRoutes } from "./flashsale.routes";
import { adminNotificationRoutes } from "./notifications.routes";
import { adminNewsletterRoutes } from "./newsletter.routes";
import { adminTailoringRoutes } from "./tailoring.routes";
import { adminInventoryRoutes } from "./inventory.routes";
import { adminReportRoutes } from "./report.routes";
import { adminSizeGuideRoutes } from "../size-guide.routes";
import { adminReturnRoutes } from "../return.routes";
import { adminInvoiceRoutes } from "./invoices.routes";
import { adminPdfRoutes } from "./pdf.routes";
import { adminBlogRoutes } from "./blog.routes";
import { adminBundleRoutes } from "./bundle.routes";
import { adminGiftCardRoutes } from "./giftcard.routes";
import { adminSettingRoutes } from "./settings.routes";
import manufacturingRoutes from "./manufacturing.routes";

const router = Router();

// TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ admin routes cÃ¡ÂºÂ§n auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/dashboard
router.get("/dashboard", async (_req, res, next) => {
  try {
    const [totalProducts, totalOrders, totalUsers, pendingOrders, revenue] =
      await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID" },
          _sum: { total: true },
        }),
      ]);

    const bestSellers = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 5,
      select: { id: true, name: true, soldCount: true, thumbnail: true },
    });

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, code: true, shippingName: true, total: true, status: true, createdAt: true },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalOrders,
          totalUsers,
          pendingOrders,
          revenue: Number(revenue._sum.total ?? 0),
        },
        bestSellers,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.use("/products", adminProductRoutes);
router.use("/orders", adminOrderRoutes);
router.use("/vouchers", adminVoucherRoutes);
router.use("/users", adminUserRoutes);
router.use("/banners", adminBannerRoutes);
router.use("/reviews", adminReviewRoutes);
router.use("/flash-sales", adminFlashSaleRoutes);
router.use("/notifications", adminNotificationRoutes);
router.use("/newsletter", adminNewsletterRoutes);
router.use("/tailoring", adminTailoringRoutes);
router.use("/inventory", adminInventoryRoutes);
router.use("/reports", adminReportRoutes);
router.use("/size-guide", adminSizeGuideRoutes);
router.use("/returns", adminReturnRoutes);
router.use("/invoices", adminInvoiceRoutes);
router.use("/orders", adminPdfRoutes);
router.use("/blog", adminBlogRoutes);
router.use("/bundles", adminBundleRoutes);
router.use("/gift-cards", adminGiftCardRoutes);
router.use("/settings", adminSettingRoutes);
router.use("/manufacturing", manufacturingRoutes);

export { router as adminRoutes };
