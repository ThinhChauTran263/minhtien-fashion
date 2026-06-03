import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { einvoiceService } from "../services/einvoice.service";

export interface InvoiceJobData {
  order: {
    id: string;
    shippingName: string;
    shippingAddress: string;
    total: number;
    paymentMethod: string;
    buyerTaxCode?: string | null;
    items: Array<{ productName: string; price: number; quantity: number }>;
  };
}

const invoiceWorker = new Worker<InvoiceJobData>(
  "invoice",
  async (job) => {
    await einvoiceService.issueForOrder(job.data.order);
  },
  {
    connection: bullConnection,
    concurrency: 2,
    limiter: { max: 5, duration: 1000 },
  }
);

invoiceWorker.on("failed", (job, err) => {
  console.error(`[InvoiceWorker] Job ${job?.id} failed:`, err.message);
});

export { invoiceWorker };
