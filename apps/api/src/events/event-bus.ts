import { JobsOptions } from "bullmq";
import { domainEventQueue } from "../config/queue";
import type { DomainEvent } from "./domain-events";

const defaultEventJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: true,
  removeOnFail: 1000,
};

function buildJobId(event: DomainEvent<unknown>): string {
  const rawId = `${event.type}-${event.idempotencyKey ?? event.aggregateId}`;
  return rawId.replace(/:/g, "-");
}

export const eventBus = {
  async publish<TPayload>(event: DomainEvent<TPayload>) {
    await domainEventQueue.add(event.type, event, {
      ...defaultEventJobOptions,
      jobId: buildJobId(event),
    });
  },
};



