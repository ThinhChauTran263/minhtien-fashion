import { Worker } from "bullmq";
import { bullConnection, emailQueue } from "../config/queue";
import { prisma } from "../config/database";
import { inventoryService } from "../services/inventory.service";
import { referralService } from "../services/referral.service";
import type { DomainEvent, OrderCreatedPayload, PaymentSucceededPayload } from "./domain-events";

async function enqueueOrderConfirmation(payload: OrderCreatedPayload) {
  if (!payload.order.userId) return;

  const user = await prisma.user.findUnique({
    where: { id: payload.order.userId },
    select: { email: true },
  });
  if (!user?.email) return;

  await emailQueue.add(
    "order_confirmation",
    {
      type: "order_confirmation",
      to: user.email,
      payload: payload.order,
    },
    {
      jobId: `email-order-confirmation-${payload.order.id}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    }
  );
}

async function enqueueLowStockCheck(payload: OrderCreatedPayload) {
  if (!payload.shouldCheckLowStock) return;

  const variantIds = payload.order.items.map((item) => item.variantId);
  const critical = await inventoryService.getCriticalVariants(variantIds);
  if (critical.length === 0) return;

  await emailQueue.add(
    "low_stock",
    {
      type: "low_stock",
      to: "",
      payload: critical,
    },
    {
      jobId: `email-low-stock-${payload.order.id}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    }
  );
}

async function handleOrderCreated(payload: OrderCreatedPayload) {
  await Promise.all([enqueueOrderConfirmation(payload), enqueueLowStockCheck(payload)]);
}

async function handlePaymentSucceeded(payload: PaymentSucceededPayload) {
  if (!payload.userId) return;
  await referralService.processReward(payload.orderId, payload.userId, payload.total);
}

export async function handleDomainEvent(event: DomainEvent) {
  switch (event.type) {
    case "order.created":
      await handleOrderCreated(event.payload as OrderCreatedPayload);
      break;
    case "payment.succeeded":
      await handlePaymentSucceeded(event.payload as PaymentSucceededPayload);
      break;
    case "payment.failed":
      break;
    default:
      throw new Error(`Unsupported domain event: ${(event as DomainEvent).type}`);
  }
}

const domainEventWorker = new Worker<DomainEvent>("domain-events", async (job) => handleDomainEvent(job.data), {
  connection: bullConnection,
  concurrency: 10,
});

domainEventWorker.on("failed", (job, err) => {
  console.error(`[DomainEventWorker] Job ${job?.id} failed:`, err.message);
});

domainEventWorker.on("completed", (job) => {
  console.log(`[DomainEventWorker] Job ${job.id} completed`);
});

export { domainEventWorker };

