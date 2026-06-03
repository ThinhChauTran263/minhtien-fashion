import ExcelJS from "exceljs";

const HEADER_STYLE = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF1A1A1A" },
  },
  alignment: { vertical: "middle" as const, horizontal: "center" as const },
};

export async function buildRevenueExcel(
  rows: { date: string; revenue: number; count: number }[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Doanh thu");

  ws.columns = [
    { header: "Ngày", key: "date", width: 15 },
    { header: "Số đơn", key: "count", width: 12 },
    { header: "Doanh thu (VND)", key: "revenue", width: 20 },
  ];

  const headerRow = ws.getRow(1);
  Object.assign(headerRow, HEADER_STYLE);
  headerRow.font = HEADER_STYLE.font;
  headerRow.fill = HEADER_STYLE.fill;
  headerRow.alignment = HEADER_STYLE.alignment;
  headerRow.height = 22;

  rows.forEach((r) => ws.addRow(r));

  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalRow = ws.addRow({ date: "TỔNG", count: totalCount, revenue: total });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF5F5F5" },
  };

  ws.getColumn("revenue").numFmt = "#,##0";
  ws.getColumn("count").alignment = { horizontal: "right" };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

export async function buildOrdersExcel(orders: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Đơn hàng");

  ws.columns = [
    { header: "Mã đơn", key: "code", width: 16 },
    { header: "Khách hàng", key: "name", width: 22 },
    { header: "SĐT", key: "phone", width: 14 },
    { header: "Tổng tiền", key: "total", width: 16 },
    { header: "Thanh toán", key: "payment", width: 12 },
    { header: "Trạng thái TT", key: "paymentStatus", width: 14 },
    { header: "Trạng thái đơn", key: "status", width: 14 },
    { header: "Ngày tạo", key: "date", width: 18 },
    { header: "Sản phẩm", key: "items", width: 50 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = HEADER_STYLE.font;
  headerRow.fill = HEADER_STYLE.fill;
  headerRow.alignment = HEADER_STYLE.alignment;
  headerRow.height = 22;

  orders.forEach((o) => {
    ws.addRow({
      code: o.code,
      name: o.shippingName,
      phone: o.shippingPhone,
      total: Number(o.total),
      payment: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      date: o.createdAt.toISOString().replace("T", " ").slice(0, 16),
      items: o.items
        .map((it: any) => `${it.productName} (${it.variantName}) x${it.quantity}`)
        .join("; "),
    });
  });

  ws.getColumn("total").numFmt = "#,##0";
  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function buildProductSalesExcel(
  rows: { name: string; slug: string; quantity: number; revenue: number }[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sản phẩm bán chạy");

  ws.columns = [
    { header: "STT", key: "no", width: 6 },
    { header: "Tên sản phẩm", key: "name", width: 36 },
    { header: "Slug", key: "slug", width: 28 },
    { header: "Số lượng bán", key: "quantity", width: 14 },
    { header: "Doanh thu (VND)", key: "revenue", width: 20 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = HEADER_STYLE.font;
  headerRow.fill = HEADER_STYLE.fill;
  headerRow.alignment = HEADER_STYLE.alignment;
  headerRow.height = 22;

  rows.forEach((r, i) => ws.addRow({ no: i + 1, ...r }));

  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totalRow = ws.addRow({
    no: "",
    name: "TỔNG",
    slug: "",
    quantity: totalQty,
    revenue: totalRev,
  });
  totalRow.font = { bold: true };

  ws.getColumn("revenue").numFmt = "#,##0";
  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}
