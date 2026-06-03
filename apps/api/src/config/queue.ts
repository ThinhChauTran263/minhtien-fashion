import { Job, JobsOptions, Queue, QueueEvents, Worker } from "bullmq";
import { env } from "./env";

const connection = { url: env.redisUrl };

export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: true,
  removeOnFail: 1000,
};

function createQueue<T = unknown>(name: string) {
  return new Queue<T>(name, {
    connection,
    defaultJobOptions,
  });
}

function createQueueEvents(name: string) {
  const queueEvents = new QueueEvents(name, { connection });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[BullMQ:${name}] Job ${jobId} failed:`, failedReason);
  });

  queueEvents.on("stalled", ({ jobId }) => {
    console.warn(`[BullMQ:${name}] Job ${jobId} stalled`);
  });

  return queueEvents;
}

export const emailQueue = createQueue("email");
export const notificationQueue = createQueue("notification");
export const shippingQueue = createQueue("shipping");
export const invoiceQueue = createQueue("invoice");
export const cacheQueue = createQueue("cache");
export const searchQueue = createQueue("search");
export const domainEventQueue = createQueue("domain-events");

export const queueEvents = [
  createQueueEvents("email"),
  createQueueEvents("notification"),
  createQueueEvents("shipping"),
  createQueueEvents("invoice"),
  createQueueEvents("cache"),
  createQueueEvents("search"),
  createQueueEvents("domain-events"),
];

export const appQueues = [
  emailQueue,
  notificationQueue,
  shippingQueue,
  invoiceQueue,
  cacheQueue,
  searchQueue,
  domainEventQueue,
];

export async function closeQueues() {
  await Promise.allSettled([
    ...queueEvents.map((events) => events.close()),
    ...appQueues.map((queue) => queue.close()),
  ]);
}

export { connection as bullConnection, Worker, Job };
export type { Queue };


