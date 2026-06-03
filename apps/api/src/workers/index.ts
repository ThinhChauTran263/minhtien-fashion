import { emailWorker } from "./email.worker";
import { notificationWorker } from "./notification.worker";
import { shippingWorker } from "./shipping.worker";
import { invoiceWorker } from "./invoice.worker";
import { cacheWorker } from "./cache.worker";
import { searchWorker } from "./search.worker";
import { domainEventWorker } from "../events/domain-event.worker";

export const appWorkers = [
  emailWorker,
  notificationWorker,
  shippingWorker,
  invoiceWorker,
  cacheWorker,
  searchWorker,
  domainEventWorker,
];

export async function closeWorkers() {
  await Promise.allSettled(appWorkers.map((worker) => worker.close()));
}

console.log("[Workers] All BullMQ workers started");


