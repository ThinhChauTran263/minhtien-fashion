import cron from "node-cron";
import { inventoryService } from "../services/inventory.service";
import { emailService } from "../services/email.service";

// 8h sáng mỗi ngày (giờ Việt Nam)
cron.schedule(
  "0 8 * * *",
  async () => {
    try {
      const lowStock = await inventoryService.getLowStockVariants();
      if (lowStock.length > 0) {
        await emailService.sendLowStockEmail(lowStock);
        console.log(`[Cron] Sent low-stock alert for ${lowStock.length} variants`);
      }
    } catch (err) {
      console.error("[Cron inventory-check]", err);
    }
  },
  { timezone: "Asia/Ho_Chi_Minh" }
);

console.log("[Cron] Inventory check scheduled (daily at 8AM Asia/Ho_Chi_Minh)");
