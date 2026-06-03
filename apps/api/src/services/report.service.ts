import { prisma } from "../config/database";

interface DateRange {
  from: Date;
  to: Date;
}

export const reportService = {
  /** Doanh thu theo thời gian trong khoảng. */
  async getRevenueReport({ from, to }: DateRange, groupBy: "day" | "month" | "quarter" | "year" = "day") {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: "PAID",
      },
      select: { createdAt: true, total: true, status: true },
    });

    const byGroup = new Map<string, { revenue: number; count: number }>();
    for (const o of orders) {
      let key = "";
      const date = o.createdAt;
      if (groupBy === "day") {
        key = date.toISOString().slice(0, 10);
      } else if (groupBy === "month") {
        key = date.toISOString().slice(0, 7); // YYYY-MM
      } else if (groupBy === "quarter") {
        const year = date.getFullYear();
        const q = Math.floor(date.getMonth() / 3) + 1;
        key = `${year}-Q${q}`;
      } else if (groupBy === "year") {
        key = date.getFullYear().toString();
      }

      const cur = byGroup.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += Number(o.total);
      cur.count += 1;
      byGroup.set(key, cur);
    }

    return Array.from(byGroup.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /** Tổng quan: doanh thu, đơn, khách, AOV. */
  async getSummary({ from, to }: DateRange) {
    const [paidOrders, allOrders, customerCount] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.user.count({
        where: { createdAt: { gte: from, lte: to }, role: "CUSTOMER" },
      }),
    ]);

    const revenue = Number(paidOrders._sum.total ?? 0);
    const paidCount = paidOrders._count.id;
    const aov = paidCount > 0 ? revenue / paidCount : 0;

    return {
      revenue,
      paidCount,
      totalOrders: allOrders,
      newCustomers: customerCount,
      aov,
    };
  },

  /** Đơn hàng chi tiết để xuất Excel. */
  async getOrdersReport({
    from,
    to,
    status,
  }: DateRange & { status?: string }) {
    return prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { productName: true, variantName: true, quantity: true } },
      },
    });
  },

  /** Sản phẩm bán chạy trong khoảng. */
  async getProductSalesReport({ from, to }: DateRange) {
    const items = await prisma.orderItem.groupBy({
      by: ["productSlug", "productName"],
      where: {
        order: {
          createdAt: { gte: from, lte: to },
          paymentStatus: "PAID",
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 50,
    });

    return items.map((it) => ({
      slug: it.productSlug,
      name: it.productName,
      quantity: it._sum.quantity ?? 0,
      revenue: Number(it._sum.subtotal ?? 0),
    }));
  },
};
