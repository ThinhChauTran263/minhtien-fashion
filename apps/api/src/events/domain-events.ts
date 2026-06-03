export type DomainEventType = "order.created" | "payment.succeeded" | "payment.failed";

export interface DomainEvent<TPayload = unknown> {
  type: DomainEventType;
  aggregateId: string;
  idempotencyKey?: string;
  occurredAt: string;
  payload: TPayload;
}

export interface OrderCreatedPayload {
  order: {
    id: string;
    code: string;
    userId?: string | null;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: Date;
    items: Array<{
      variantId: string;
      productName: string;
      productSlug: string;
      variantName: string;
      image: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>;
  };
  shouldCheckLowStock: boolean;
}

export interface PaymentSucceededPayload {
  orderId: string;
  userId?: string | null;
  total: number;
  paymentRef?: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  paymentRef?: string;
}

export type OrderCreatedEvent = DomainEvent<OrderCreatedPayload> & { type: "order.created" };
export type PaymentSucceededEvent = DomainEvent<PaymentSucceededPayload> & { type: "payment.succeeded" };
export type PaymentFailedEvent = DomainEvent<PaymentFailedPayload> & { type: "payment.failed" };
