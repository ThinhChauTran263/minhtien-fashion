import axios from "axios";
import { prisma } from "../config/database";
import { extractVatInclusive, toVND } from "../utils/money";

const EINVOICE_URL = process.env.EINVOICE_URL || "";
const EINVOICE_USERNAME = process.env.EINVOICE_USERNAME || "";
const EINVOICE_PASSWORD = process.env.EINVOICE_PASSWORD || "";
const VAT_RATE = Number(process.env.VAT_RATE || 8);

const enabled = Boolean(EINVOICE_URL && EINVOICE_USERNAME && EINVOICE_PASSWORD);

const client = axios.create({ baseURL: EINVOICE_URL, timeout: 15000 });

async function getToken(): Promise<string> {
  const res = await client.post("/auth/login", {
    username: EINVOICE_USERNAME,
    password: EINVOICE_PASSWORD,
  });
  return res.data.access_token ?? res.data.token;
}

function calcVat(total: number): number {
  return extractVatInclusive(total, VAT_RATE);
}

interface OrderForInvoice {
  id: string;
  shippingName: string;
  shippingAddress: string;
  total: number;
  paymentMethod: string;
  buyerTaxCode?: string | null;
  items: Array<{ productName: string; price: number; quantity: number }>;
}

export const einvoiceService = {
  isEnabled: () => enabled,

  /**
   * Tạo + lưu hoá đơn cho 1 order. Idempotent: nếu đã có invoice ISSUED thì bỏ qua.
   */
  async issueForOrder(order: OrderForInvoice) {
    const existing = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    if (existing && existing.status === "ISSUED") return existing;

    const vatAmount = calcVat(Number(order.total));

    if (!enabled) {
      // Lưu DRAFT khi chưa cấu hình provider
      return prisma.invoice.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          buyerName: order.shippingName,
          buyerAddress: order.shippingAddress,
          buyerTaxCode: order.buyerTaxCode ?? undefined,
          totalAmount: Number(order.total),
          vatAmount,
          status: "DRAFT",
          errorMessage: "E-Invoice provider chưa cấu hình",
        },
        update: { status: "DRAFT" },
      });
    }

    try {
      const token = await getToken();
      const invoiceData = {
        generalInvoiceInfo: {
          invoiceType: "01GTKT",
          currencyCode: "VND",
          buyerName: order.shippingName,
          buyerAddress: order.shippingAddress,
          buyerTaxCode: order.buyerTaxCode ?? "",
          paymentMethodName: order.paymentMethod === "COD" ? "TM" : "CK",
        },
        itemInfo: order.items.map((item, idx) => ({
          lineNumber: idx + 1,
          itemName: item.productName,
          unitName: "Cái",
          quantity: item.quantity,
          unitPrice: item.price,
          itemTotalAmountWithoutTax: item.price * item.quantity,
          taxPercentage: VAT_RATE,
        })),
      };

      const res = await client.post("/invoice/create", invoiceData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return prisma.invoice.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          invoiceNumber: res.data.invoiceNo,
          invoiceSerial: res.data.serial,
          invoiceDate: new Date(),
          buyerName: order.shippingName,
          buyerAddress: order.shippingAddress,
          buyerTaxCode: order.buyerTaxCode ?? undefined,
          totalAmount: Number(order.total),
          vatAmount,
          status: "ISSUED",
          pdfUrl: res.data.pdfUrl,
        },
        update: {
          invoiceNumber: res.data.invoiceNo,
          invoiceSerial: res.data.serial,
          invoiceDate: new Date(),
          status: "ISSUED",
          pdfUrl: res.data.pdfUrl,
          errorMessage: null,
        },
      });
    } catch (err: any) {
      return prisma.invoice.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          buyerName: order.shippingName,
          buyerAddress: order.shippingAddress,
          totalAmount: Number(order.total),
          vatAmount,
          status: "ERROR",
          errorMessage: err.message?.slice(0, 500) ?? "Unknown error",
        },
        update: { status: "ERROR", errorMessage: err.message?.slice(0, 500) },
      });
    }
  },

  async cancelInvoice(invoiceId: string, reason: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error("Hoá đơn không tồn tại");

    if (enabled && invoice.invoiceNumber) {
      const token = await getToken();
      await client.post(
        "/invoice/cancel",
        { invoiceNumber: invoice.invoiceNumber, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "CANCELLED", errorMessage: reason },
    });
  },
};
