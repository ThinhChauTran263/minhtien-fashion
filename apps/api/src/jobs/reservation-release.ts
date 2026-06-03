import { Queue, Worker } from "bullmq";
import { prisma } from "../config/database";
import { stockService } from "../services/stock.service";
import { bullConnection } from "../config/queue";

const reservationQueue = new Queue("reservation-release", {
  connection: bullConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});

const reservationWorker = new Worker(
  "reservation-release",
  async () => {
    const now = new Date();
    const expiredOrders = await prisma.order.findMany({
      where: {
        reservedUntil: { lt: now },
        status: "PENDING",
        paymentStatus: "PENDING",
        stockRestored: false,
        stockDeducted: false,
      },
      include: { items: true },
      take: 50,
    });

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          const [locked] = await tx.$queryRaw<
            Array<{ id: string; stockRestored: boolean; status: string }>
          >`SELECT id, "stockRestored", status FROM "Order" WHERE id = ${order.id} FOR UPDATE`;

          if (!locked || locked.stockRestored || locked.status !== "PENDING") return;

          for (const item of order.items) {
            await stockService.release(tx, item.variantId, item.quantity, order.id);
          }

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              stockRestored: true,
              reservedUntil: null,
              cancelReason: "Hết thời gian thanh toán (15 phút)",
            },
          });
        });
        console.log(`[ReservationWorker] Released order ${order.code}`);
      } catch (err) {
        console.error(`[ReservationWorker] Failed order ${order.code}:`, err);
      }
    }

    if (expiredOrders.length > 0) {
      console.log(`[ReservationWorker] Processed ${expiredOrders.length} expired reservations`);
    }
  },
  { connection: bullConnection, concurrency: 1 }
);

// Repeatable job: mỗi 2 phút
reservationQueue.upsertJobScheduler(
  "release-expired",
  { every: 2 * 60 * 1000 },
  { name: "release-expired" }
);

reservationWorker.on("failed", (job, err) => {
  console.error(`[ReservationWorker] Job ${job?.id} failed:`, err.message);
});

console.log("[BullMQ] Reservation release worker started (every 2 minutes)");

export { reservationQueue, reservationWorker };
