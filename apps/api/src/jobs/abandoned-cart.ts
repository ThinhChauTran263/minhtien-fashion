import cron from "node-cron";
import { prisma } from "../config/database";
import { emailService } from "../services/email.service";

const ABANDON_THRESHOLD_MS = 60 * 60 * 1000; // 1 giờ
const MAX_REMINDERS = 2; // Tối đa 2 email (1h + 24h)
const SECOND_REMINDER_MS = 24 * 60 * 60 * 1000; // 24 giờ

/**
 * Mỗi 15 phút quét Cart có items + user có email + updatedAt > 1h
 * mà chưa gửi reminder (hoặc đã gửi lần 1 nhưng > 24h).
 * Idempotent: check lastReminderSentAt + reminderCount.
 */
cron.schedule("*/15 * * * *", async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - ABANDON_THRESHOLD_MS);
    const oneDayAgo = new Date(now.getTime() - SECOND_REMINDER_MS);

    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: { lt: oneHourAgo },
        items: { some: {} },
        reminderCount: { lt: MAX_REMINDERS },
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: oneDayAgo }, reminderCount: 1 },
        ],
      },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true, thumbnail: true, slug: true } } },
            },
          },
        },
      },
      take: 30,
    });

    for (const cart of abandonedCarts) {
      if (!cart.user.email) continue;

      try {
        const itemsHtml = cart.items
          .map(
            (item) =>
              `<tr>
                <td style="padding:8px"><img src="${item.variant.product.thumbnail}" width="50" height="50" style="border-radius:4px"/></td>
                <td style="padding:8px">${item.variant.product.name} (${item.variant.color}/${item.variant.size})</td>
                <td style="padding:8px">x${item.quantity}</td>
              </tr>`
          )
          .join("");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1a1a1a">Bạn quên giỏ hàng rồi!</h2>
            <p>Xin chào ${cart.user.name || "bạn"},</p>
            <p>Giỏ hàng của bạn vẫn đang chờ. Đừng bỏ lỡ những sản phẩm yêu thích nhé!</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              ${itemsHtml}
            </table>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/gio-hang"
               style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px">
              Quay lại giỏ hàng
            </a>
            <p style="color:#666;font-size:12px;margin-top:24px">Minh Tien Fashion - Thời trang nam cao cấp</p>
          </div>
        `;

        await emailService.sendGeneric(
          cart.user.email,
          cart.reminderCount === 0
            ? "Giỏ hàng của bạn đang chờ! 🛒"
            : "Ưu đãi sắp hết - Hoàn tất đơn hàng ngay!",
          html
        );

        await prisma.cart.update({
          where: { id: cart.id },
          data: {
            lastReminderSentAt: now,
            reminderCount: { increment: 1 },
          },
        });

        console.log(`[Cron] Abandoned cart reminder sent to ${cart.user.email} (#${cart.reminderCount + 1})`);
      } catch (err) {
        console.error(`[Cron] Failed to send cart reminder for ${cart.id}:`, err);
      }
    }

    if (abandonedCarts.length > 0) {
      console.log(`[Cron] Processed ${abandonedCarts.length} abandoned carts`);
    }
  } catch (err) {
    console.error("[Cron abandoned-cart]", err);
  }
});

console.log("[Cron] Abandoned cart recovery scheduled (every 15 minutes)");
