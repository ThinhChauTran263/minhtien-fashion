import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { shippingService } from "../services/shipping.service";

export interface ShippingJobData {
  type: "create_order" | "cancel_order";
  payload: any;
}

const shippingWorker = new Worker<ShippingJobData>(
  "shipping",
  async (job) => {
    const { type, payload } = job.data;
    switch (type) {
      case "create_order":
        await shippingService.createShippingOrder(payload);
        break;
      case "cancel_order":
        await shippingService.cancelOrder(payload.ghnOrderCode);
        break;
    }
  },
  {
    connection: bullConnection,
    concurrency: 3,
  }
);

shippingWorker.on("failed", (job, err) => {
  console.error(`[ShippingWorker] Job ${job?.id} failed:`, err.message);
});

export { shippingWorker };
