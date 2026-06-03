import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { productSearchService } from "../search/product-search.service";

export interface SearchJobData {
  type: "upsert_product" | "delete_product" | "rebuild_products_index" | "configure_products_index";
  productId?: string;
}

const searchWorker = new Worker<SearchJobData>(
  "search",
  async (job) => {
    switch (job.data.type) {
      case "configure_products_index":
        await productSearchService.bootstrap();
        break;
      case "upsert_product":
        if (job.data.productId) {
          await productSearchService.upsertProduct(job.data.productId);
        }
        break;
      case "delete_product":
        if (job.data.productId) {
          await productSearchService.deleteProduct(job.data.productId);
        }
        break;
      case "rebuild_products_index":
        await productSearchService.rebuildProductsIndex();
        break;
      default:
        throw new Error(`Unsupported search job: ${job.data.type}`);
    }
  },
  {
    connection: bullConnection,
    concurrency: 3,
  }
);

searchWorker.on("failed", (job, err) => {
  console.error(`[SearchWorker] Job ${job?.id} failed:`, err.message);
});

searchWorker.on("completed", (job) => {
  console.log(`[SearchWorker] Job ${job.id} completed`);
});

export { searchWorker };

