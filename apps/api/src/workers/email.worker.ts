import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { prisma } from "../config/database";
import { emailService } from "../services/email.service";
import { inventoryService } from "../services/inventory.service";

export interface EmailJobData {
  type: "order_confirmation" | "order_confirmation_for_user" | "order_status" | "abandoned_cart" | "low_stock" | "low_stock_for_variants" | "generic";
  to?: string;
  userId?: string;
  subject?: string;
  html?: string;
  payload?: any;
  variantIds?: string[];
}

const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { type, to, subject, html, payload } = job.data;

    switch (type) {
      case "generic":
        await emailService.sendGeneric(to!, subject!, html!);
        break;
      case "order_confirmation":
        await emailService.sendOrderConfirmation(payload, to!);
        break;
      case "order_confirmation_for_user": {
        if (!job.data.userId) return;
        const user = await prisma.user.findUnique({
          where: { id: job.data.userId },
          select: { email: true },
        });
        if (user?.email) {
          await emailService.sendOrderConfirmation(payload, user.email);
        }
        break;
      }
      case "order_status":
        await emailService.sendOrderStatusUpdate(payload, to!);
        break;
      case "low_stock":
        await emailService.sendLowStockEmail(payload);
        break;
      case "low_stock_for_variants": {
        const critical = await inventoryService.getCriticalVariants(job.data.variantIds ?? []);
        if (critical.length > 0) {
          await emailService.sendLowStockEmail(critical as any);
        }
        break;
      }
      default:
        await emailService.sendGeneric(to!, subject!, html!);
    }
  },
  {
    connection: bullConnection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  }
);

emailWorker.on("failed", (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on("completed", (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

export { emailWorker };


