import { Worker } from "bullmq";
import { bullConnection } from "../config/queue";
import { notificationService } from "../services/notification.service";

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

const notificationWorker = new Worker<NotificationJobData>(
  "notification",
  async (job) => {
    await notificationService.sendToUser(job.data.userId, {
      title: job.data.title,
      body: job.data.body,
      url: job.data.url,
    });
  },
  {
    connection: bullConnection,
    concurrency: 10,
  }
);

notificationWorker.on("failed", (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
});

export { notificationWorker };
