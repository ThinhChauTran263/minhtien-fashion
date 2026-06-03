import webpush from "web-push";
import { prisma } from "../config/database";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:no-reply@minhtien.vn";

const enabled = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

if (enabled) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  console.warn("[Push] VAPID keys chưa cấu hình - push notifications bị tắt.");
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export const notificationService = {
  isEnabled: () => enabled,

  getPublicKey: () => VAPID_PUBLIC,

  async subscribe(sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userId?: string;
  }) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userId: sub.userId!,
      },
      update: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userId: sub.userId,
      },
    });
  },

  async unsubscribe(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { success: true };
  },

  /**
   * Gửi push tới 1 subscription. Tự xoá subscription nếu hết hạn (410/404).
   */
  async sendToSubscription(
    sub: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
  ): Promise<boolean> {
    if (!enabled) return false;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      return true;
    } catch (err: any) {
      // Subscription hết hạn → xoá
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: sub.endpoint },
        });
      } else {
        console.error("[Push] Send failed:", err?.message ?? err);
      }
      return false;
    }
  },

  /**
   * Gửi tới 1 user (tất cả thiết bị đã đăng ký).
   */
  async sendToUser(userId: string, payload: PushPayload) {
    if (!enabled) return { sent: 0 };
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const results = await Promise.all(
      subs.map((s) => this.sendToSubscription(s, payload))
    );
    return { sent: results.filter(Boolean).length };
  },

  /**
   * Broadcast tới tất cả subscriptions (vd flash sale, voucher mới).
   */
  async broadcast(payload: PushPayload) {
    if (!enabled) return { sent: 0, total: 0 };
    const subs = await prisma.pushSubscription.findMany();
    const results = await Promise.all(
      subs.map((s) => this.sendToSubscription(s, payload))
    );
    return { sent: results.filter(Boolean).length, total: subs.length };
  },
};
