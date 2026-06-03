import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { cacheService } from "../services/cache.service";

export interface CacheJobData {
  type: "invalidate_keys" | "invalidate_order_products";
  keys?: string[];
  productSlugs?: string[];
}

const cacheWorker = new Worker<CacheJobData>(
  "cache",
  async (job) => {
    const { type, keys = [], productSlugs = [] } = job.data;

    switch (type) {
      case "invalidate_keys":
        if (keys.length > 0) {
          await cacheService.del(...keys);
        }
        break;
      case "invalidate_order_products": {
        const productKeys = productSlugs.map((slug) => cacheService.keys.productBySlug(slug));
        await cacheService.del(...Array.from(new Set(productKeys)), cacheService.keys.featuredProducts);
        break;
      }
      default:
        throw new Error(`Unsupported cache job: ${type}`);
    }
  },
  {
    connection: bullConnection,
    concurrency: 10,
  }
);

cacheWorker.on("failed", (job, err) => {
  console.error(`[CacheWorker] Job ${job?.id} failed:`, err.message);
});

cacheWorker.on("completed", (job) => {
  console.log(`[CacheWorker] Job ${job.id} completed`);
});

export { cacheWorker };
