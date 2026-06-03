import { env } from "../config/env";

const formatVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn trả",
};

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.5;
`;

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;${baseStyle}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:1px;">
                MINH TIEN FASHION
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#fafafa;border-top:1px solid #e5e5e5;text-align:center;font-size:12px;color:#737373;">
              <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} Minh Tien Fashion. All rights reserved.</p>
              <p style="margin:0;">Email tự động, vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface OrderEmailData {
  code: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  subtotal: number | string;
  shippingFee: number | string;
  discount: number | string;
  total: number | string;
  status: string;
  paymentMethod: string;
  createdAt: Date | string;
  items: Array<{
    productName: string;
    variantName: string;
    image?: string;
    price: number | string;
    quantity: number;
    subtotal: number | string;
  }>;
}

export function orderConfirmationTemplate(order: OrderEmailData): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${
                item.image
                  ? `<td width="60" style="vertical-align:top;">
                      <img src="${item.image}" alt="" width="60" height="60" style="display:block;border-radius:4px;object-fit:cover;" />
                    </td>`
                  : ""
              }
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0;font-weight:600;font-size:14px;color:#1a1a1a;">${item.productName}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#737373;">${item.variantName} × ${item.quantity}</p>
              </td>
              <td align="right" style="vertical-align:top;font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;">
                ${formatVnd(Number(item.subtotal))}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const orderUrl = `${env.frontendUrl}/don-hang/${order.code}`;

  const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;color:#1a1a1a;">Cảm ơn bạn đã đặt hàng!</h2>
    <p style="margin:0 0 24px 0;color:#525252;font-size:14px;">
      Chào ${order.shippingName}, đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
    </p>

    <div style="background:#fafafa;border-radius:6px;padding:16px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
        <tr>
          <td style="color:#737373;padding:4px 0;">Mã đơn hàng</td>
          <td align="right" style="font-weight:600;font-family:monospace;">${order.code}</td>
        </tr>
        <tr>
          <td style="color:#737373;padding:4px 0;">Ngày đặt</td>
          <td align="right">${formatDate(order.createdAt)}</td>
        </tr>
        <tr>
          <td style="color:#737373;padding:4px 0;">Thanh toán</td>
          <td align="right">${order.paymentMethod}</td>
        </tr>
      </table>
    </div>

    <h3 style="margin:0 0 12px 0;font-size:16px;color:#1a1a1a;">Sản phẩm</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      ${itemsHtml}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr>
        <td style="color:#737373;padding:4px 0;">Tạm tính</td>
        <td align="right">${formatVnd(Number(order.subtotal))}</td>
      </tr>
      <tr>
        <td style="color:#737373;padding:4px 0;">Phí vận chuyển</td>
        <td align="right">${formatVnd(Number(order.shippingFee))}</td>
      </tr>
      ${
        Number(order.discount) > 0
          ? `<tr>
            <td style="color:#737373;padding:4px 0;">Giảm giá</td>
            <td align="right" style="color:#16a34a;">-${formatVnd(Number(order.discount))}</td>
          </tr>`
          : ""
      }
      <tr>
        <td style="border-top:2px solid #1a1a1a;padding-top:8px;font-weight:700;font-size:16px;">Tổng cộng</td>
        <td align="right" style="border-top:2px solid #1a1a1a;padding-top:8px;font-weight:700;font-size:16px;">${formatVnd(Number(order.total))}</td>
      </tr>
    </table>

    <h3 style="margin:24px 0 12px 0;font-size:16px;color:#1a1a1a;">Địa chỉ giao hàng</h3>
    <div style="background:#fafafa;border-radius:6px;padding:16px;font-size:14px;line-height:1.6;">
      <strong>${order.shippingName}</strong><br/>
      ${order.shippingPhone}<br/>
      ${order.shippingAddress}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
      <tr>
        <td align="center">
          <a href="${orderUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            Xem chi tiết đơn hàng
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapTemplate(`Xác nhận đơn hàng ${order.code}`, body);
}

export function orderStatusTemplate(order: OrderEmailData): string {
  const orderUrl = `${env.frontendUrl}/don-hang/${order.code}`;
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;color:#1a1a1a;">Cập nhật đơn hàng</h2>
    <p style="margin:0 0 24px 0;color:#525252;font-size:14px;">
      Chào ${order.shippingName}, đơn hàng <strong style="font-family:monospace;">${order.code}</strong> của bạn vừa được cập nhật.
    </p>

    <div style="background:#fafafa;border-radius:6px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#737373;">Trạng thái mới</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">${statusLabel}</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;background:#fafafa;border-radius:6px;padding:0;">
      <tr>
        <td style="padding:12px 16px;color:#737373;">Mã đơn</td>
        <td align="right" style="padding:12px 16px;font-family:monospace;font-weight:600;">${order.code}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#737373;border-top:1px solid #f0f0f0;">Tổng tiền</td>
        <td align="right" style="padding:12px 16px;border-top:1px solid #f0f0f0;font-weight:600;">${formatVnd(Number(order.total))}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
      <tr>
        <td align="center">
          <a href="${orderUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            Theo dõi đơn hàng
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapTemplate(`Cập nhật đơn hàng ${order.code}`, body);
}

export function passwordResetTemplate(resetLink: string, name?: string): string {
  const body = `
    <h2 style="margin:0 0 8px 0;font-size:24px;color:#1a1a1a;">Đặt lại mật khẩu</h2>
    <p style="margin:0 0 24px 0;color:#525252;font-size:14px;">
      ${name ? `Chào ${name}, ` : ""}Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
      Nhấn nút bên dưới để tạo mật khẩu mới.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
      <tr>
        <td align="center">
          <a href="${resetLink}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            Đặt lại mật khẩu
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 8px 0;font-size:13px;color:#737373;">
      Hoặc copy link sau vào trình duyệt:
    </p>
    <p style="margin:0 0 24px 0;font-size:12px;color:#525252;word-break:break-all;background:#fafafa;padding:12px;border-radius:4px;">
      ${resetLink}
    </p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:16px;font-size:13px;color:#92400e;">
      <strong>Lưu ý bảo mật:</strong>
      <ul style="margin:8px 0 0 0;padding-left:20px;">
        <li>Link này hết hạn sau <strong>1 giờ</strong>.</li>
        <li>Chỉ sử dụng được <strong>một lần</strong>.</li>
        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</li>
      </ul>
    </div>
  `;

  return wrapTemplate("Đặt lại mật khẩu - Minh Tien Fashion", body);
}
