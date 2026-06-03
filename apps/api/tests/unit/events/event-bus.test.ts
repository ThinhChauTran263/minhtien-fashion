jest.mock("../../../src/config/queue", () => ({
  domainEventQueue: {
    add: jest.fn(),
  },
}));

import { domainEventQueue } from "../../../src/config/queue";
import { eventBus } from "../../../src/events/event-bus";

describe("eventBus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("publishes domain events to the domain event queue with idempotent job ids", async () => {
    await eventBus.publish({
      type: "order.created",
      aggregateId: "order-1",
      occurredAt: "2026-06-02T00:00:00.000Z",
      payload: { orderId: "order-1", code: "MTF-1" },
    });

    expect(domainEventQueue.add).toHaveBeenCalledWith(
      "order.created",
      expect.objectContaining({
        type: "order.created",
        aggregateId: "order-1",
        payload: { orderId: "order-1", code: "MTF-1" },
      }),
      expect.objectContaining({
        jobId: "order.created-order-1",
        attempts: 5,
        removeOnComplete: true,
      })
    );
  });

  it("uses an explicit idempotency key when provided", async () => {
    await eventBus.publish({
      type: "payment.succeeded",
      aggregateId: "order-1",
      idempotencyKey: "vnpay:txn-1",
      occurredAt: "2026-06-02T00:00:00.000Z",
      payload: { orderId: "order-1", transactionId: "txn-1" },
    });

    expect(domainEventQueue.add).toHaveBeenCalledWith(
      "payment.succeeded",
      expect.any(Object),
      expect.objectContaining({ jobId: "payment.succeeded-vnpay-txn-1" })
    );
  });
});

