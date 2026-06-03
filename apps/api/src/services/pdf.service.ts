import PDFDocument from "pdfkit";
import QRCode from "qrcode";

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + "d";
}

interface OrderForPdf {
  code: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  createdAt: Date | string;
  items: Array<{
    productName: string;
    variantName: string;
    price: number;
    quantity: number;
  }>;
}

async function renderLabel(doc: PDFKit.PDFDocument, order: OrderForPdf) {
  doc.fontSize(14).font("Helvetica-Bold").text("MINH TIEN FASHION", { align: "center" });
  doc.fontSize(8).font("Helvetica").text("Hotline: 1900-xxxx", { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(12).font("Helvetica-Bold").text(`Ma don: ${order.code}`);

  // QR code
  try {
    const qr = await QRCode.toBuffer(order.code, { width: 70, margin: 0 });
    doc.image(qr, doc.page.width - 80, 15, { width: 60 });
  } catch {
    /* ignore qr failure */
  }
  doc.moveDown(0.3);

  doc.fontSize(10).font("Helvetica-Bold").text("Nguoi nhan:");
  doc.fontSize(11).font("Helvetica").text(order.shippingName);
  doc.fontSize(9).text(order.shippingPhone);
  doc.fontSize(9).text(order.shippingAddress, { width: 263 });
  doc.moveDown(0.5);

  doc.fontSize(8).font("Helvetica-Bold").text("Nguoi gui: Minh Tien Fashion");
  doc.fontSize(8).font("Helvetica").text("123 ABC, Q1, TPHCM");
  doc.moveDown(0.3);

  if (order.paymentMethod === "COD") {
    doc.fontSize(11).font("Helvetica-Bold").text(`THU HO (COD): ${formatVND(order.total)}`, { align: "center" });
  } else {
    doc.fontSize(10).font("Helvetica").text("Da thanh toan", { align: "center" });
  }

  doc.moveDown(0.3);
  doc.fontSize(8).font("Helvetica").text(`San pham: ${order.items.length} mon`);
}

export const pdfService = {
  async generateShippingLabel(order: OrderForPdf): Promise<Buffer> {
    const doc = new PDFDocument({ size: [283, 425], margin: 10 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    await renderLabel(doc, order);
    doc.end();
    return done;
  },

  async generateBatchLabels(orders: OrderForPdf[]): Promise<Buffer> {
    const doc = new PDFDocument({ size: [283, 425], margin: 10 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    for (let i = 0; i < orders.length; i++) {
      if (i > 0) doc.addPage();
      await renderLabel(doc, orders[i]);
    }
    doc.end();
    return done;
  },

  generateInvoicePDF(order: OrderForPdf): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(20).font("Helvetica-Bold").text("HOA DON BAN HANG", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text("MINH TIEN FASHION", { align: "center" });
    doc.text("Ao nam cao cap - minhtien.vn", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10);
    doc.text(`Ma don: ${order.code}`);
    doc.text(`Ngay: ${new Date(order.createdAt).toLocaleDateString("vi-VN")}`);
    doc.text(`Khach hang: ${order.shippingName}`);
    doc.text(`SDT: ${order.shippingPhone}`);
    doc.text(`Dia chi: ${order.shippingAddress}`);
    doc.moveDown();

    const tableTop = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("San pham", 50, tableTop);
    doc.text("SL", 330, tableTop);
    doc.text("Don gia", 380, tableTop);
    doc.text("Thanh tien", 470, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font("Helvetica");
    for (const item of order.items) {
      doc.text(`${item.productName} (${item.variantName})`, 50, y, { width: 270 });
      doc.text(String(item.quantity), 330, y);
      doc.text(formatVND(item.price), 380, y);
      doc.text(formatVND(item.price * item.quantity), 470, y);
      y += 25;
    }

    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc.text("Tam tinh:", 380, y);
    doc.text(formatVND(order.subtotal), 470, y);
    y += 18;
    doc.text("Phi ship:", 380, y);
    doc.text(formatVND(order.shippingFee), 470, y);
    if (order.discount > 0) {
      y += 18;
      doc.text("Giam gia:", 380, y);
      doc.text(`-${formatVND(order.discount)}`, 470, y);
    }
    y += 18;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("TONG CONG:", 380, y);
    doc.text(formatVND(order.total), 470, y);

    doc.end();
    return done;
  },
};
