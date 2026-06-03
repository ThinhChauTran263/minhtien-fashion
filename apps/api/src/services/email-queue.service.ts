/**
 * Helper to enqueue email jobs to BullMQ instead of using setImmediate().
 *
 * Why: setImmediate() runs in the same Node.js process — if the process crashes
 * before the email is sent, the email is lost. BullMQ persists jobs to Redis,
 * so they survive crashes and can be retried.
 */

import { emailQueue } from "../config/queue";
import type { EmailJobData } from "../workers/email.worker";

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const emailQueueService = {
  async sendOrderConfirmation(payload: any, to: string) {
    await emailQueue.add(
      "order_confirmation",
      { type: "order_confirmation", to, payload } as EmailJobData,
      DEFAULT_JOB_OPTS
    );
  },

  async sendOrderStatus(payload: any, to: string) {
    await emailQueue.add(
      "order_status",
      { type: "order_status", to, payload } as EmailJobData,
      DEFAULT_JOB_OPTS
    );
  },

  async sendLowStock(payload: any) {
    // recipient handled inside worker (admin email)
    await emailQueue.add(
      "low_stock",
      { type: "low_stock", to: "admin", payload } as EmailJobData,
      DEFAULT_JOB_OPTS
    );
  },

  async sendGeneric(to: string, subject: string, html: string) {
    await emailQueue.add(
      "generic",
      { type: "generic", to, subject, html } as EmailJobData,
      DEFAULT_JOB_OPTS
    );
  },
};
