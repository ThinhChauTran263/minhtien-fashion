import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import {
  orderConfirmationTemplate,
  orderStatusTemplate,
  passwordResetTemplate,
  type OrderEmailData,
} from "./email-templates";

const FROM_EMAIL = process.env.SES_FROM_EMAIL || "no-reply@minhtien.vn";
const FROM_NAME = "Minh Tien Fashion";

// SES (production) hoặc SMTP (dev) hoặc console log (no config)
const hasSesCreds = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

const hasSmtpCreds = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_PORT
);

const sesClient = hasSesCreds
  ? new SESClient({
      region: env.aws.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

let smtpTransporter: Transporter | null = null;
if (hasSmtpCreds) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  try {
    // Ưu tiên SES nếu có credentials
    if (sesClient) {
      await sesClient.send(
        new SendEmailCommand({
          Source: `${FROM_NAME} <${FROM_EMAIL}>`,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Html: { Data: html, Charset: "UTF-8" } },
          },
        })
      );
      console.log(`[Email] Sent via SES to ${to} | ${subject}`);
      return true;
    }

    // Fallback SMTP
    if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent via SMTP to ${to} | ${subject}`);
      return true;
    }

    // Dev mode - log to console
    console.log("[Email] No email provider configured. Would send:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML preview: ${html.slice(0, 200)}...`);
    return false;
  } catch (err) {
    console.error("[Email] Failed to send:", err instanceof Error ? err.message : err);
    return false;
  }
}

export const emailService = {
  async sendGeneric(to: string, subject: string, html: string) {
    return sendEmail({ to, subject, html });
  },

  async sendRestockEmail(
    email: string,
    product: { name: string; slug: string; thumbnail: string; price: number }
  ) {
    const url = `${env.frontendUrl}/san-pham/${product.slug}`;
    const priceStr = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price);
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">${product.name} đã có hàng trở lại!</h2>
      <img src="${product.thumbnail}" alt="${product.name}" width="200" style="border-radius:8px;margin:16px 0;" />
      <p style="font-size:18px;font-weight:600;color:#dc2626;">${priceStr}</p>
      <p style="color:#525252;">Sản phẩm bạn quan tâm đã có hàng. Nhanh tay đặt ngay kẻo lỡ!</p>
      <a href="${url}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px;">Mua ngay</a>
    </body></html>`;
    return sendEmail({
      to: email,
      subject: `[MTF] ${product.name} đã có hàng trở lại!`,
      html,
    });
  },

  async sendGiftCardEmail(card: {
    code: string;
    amount: number;
    recipientName?: string | null;
    recipientEmail: string;
    message?: string | null;
    expiresAt: Date;
  }) {
    const amountStr = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(card.amount);
    const expiry = new Intl.DateTimeFormat("vi-VN").format(card.expiresAt);
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fafafa;">
      <div style="background:linear-gradient(135deg,#1a1a1a,#404040);border-radius:16px;padding:32px;color:#fff;text-align:center;">
        <p style="margin:0;font-size:14px;opacity:0.8;">THẺ QUÀ TẶNG</p>
        <h1 style="margin:8px 0;font-size:36px;">${amountStr}</h1>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;font-size:12px;opacity:0.8;">Mã thẻ</p>
          <p style="margin:4px 0 0;font-size:24px;font-family:monospace;letter-spacing:2px;font-weight:700;">${card.code}</p>
        </div>
        <p style="margin:0;font-size:13px;opacity:0.8;">Minh Tien Fashion</p>
      </div>
      ${card.recipientName ? `<p style="margin-top:24px;">Gửi <strong>${card.recipientName}</strong>,</p>` : ""}
      ${card.message ? `<p style="font-style:italic;color:#525252;background:#fff;padding:16px;border-radius:8px;border-left:4px solid #1a1a1a;">"${card.message}"</p>` : ""}
      <p style="color:#737373;font-size:13px;">Hạn sử dụng: ${expiry}. Nhập mã tại trang thanh toán để sử dụng.</p>
      <a href="${env.frontendUrl}/tai-khoan/the-qua-tang" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Sử dụng ngay</a>
    </body></html>`;
    return sendEmail({
      to: card.recipientEmail,
      subject: `Bạn nhận được thẻ quà tặng ${amountStr} từ Minh Tien Fashion`,
      html,
    });
  },

  async sendOrderConfirmation(order: OrderEmailData, email: string) {
    const html = orderConfirmationTemplate(order);
    return sendEmail({
      to: email,
      subject: `Xác nhận đơn hàng ${order.code} - Minh Tien Fashion`,
      html,
    });
  },

  async sendOrderStatusUpdate(order: OrderEmailData, email: string) {
    const html = orderStatusTemplate(order);
    return sendEmail({
      to: email,
      subject: `Cập nhật đơn hàng ${order.code} - Minh Tien Fashion`,
      html,
    });
  },

  async sendPasswordReset(email: string, resetLink: string, name?: string) {
    const html = passwordResetTemplate(resetLink, name);
    return sendEmail({
      to: email,
      subject: "Đặt lại mật khẩu - Minh Tien Fashion",
      html,
    });
  },

  async sendLowStockEmail(
    variants: Array<{
      sku: string;
      size: string;
      color: string;
      stock: number;
      product: { name: string; slug: string };
    }>
  ) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@minhtien.vn";
    if (variants.length === 0) return false;

    const rows = variants
      .map(
        (v) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${v.product.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${v.size} / ${v.color}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;">${v.sku}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:${v.stock === 0 ? "#dc2626" : "#d97706"};font-weight:600;">${v.stock}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">[MTF] Cảnh báo tồn kho</h2>
      <p>Có <strong>${variants.length}</strong> sản phẩm/biến thể đang ở mức cảnh báo:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;">
        <thead><tr style="background:#f5f5f5;">
          <th style="padding:8px 12px;text-align:left;">Sản phẩm</th>
          <th style="padding:8px 12px;text-align:left;">Size/Màu</th>
          <th style="padding:8px 12px;text-align:left;">SKU</th>
          <th style="padding:8px 12px;text-align:right;">Còn</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#737373;font-size:13px;">Truy cập admin để cập nhật tồn kho hoặc nhập thêm hàng.</p>
    </body></html>`;

    return sendEmail({
      to: adminEmail,
      subject: `[MTF] Cảnh báo tồn kho - ${variants.length} sản phẩm sắp hết`,
      html,
    });
  },
};
