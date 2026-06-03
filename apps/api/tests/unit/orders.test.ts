import { randomUUID } from "crypto";
import request from "supertest";
import { OrderStatus } from "@prisma/client";
import { app } from "../../src/app";
import { prisma } from "../../src/config/database";
import { login } from "../helpers";
import { orderService } from "../../src/services/order.service";

describe("Orders", () => {
  it("rejects empty checkout", async () => {
    const token = await login();
    const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "COD", items: [] });
    expect(res.status).toBe(400);
  });

  it("checks out successfully and decrements stock", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({
      shippingName: "Customer Test",
      shippingPhone: "0900000000",
      shippingAddress: "1 Test Street",
      paymentMethod: "COD",
      items: [{ variantId: variant.id, quantity: 1 }],
    });
    expect(res.status).toBe(201);
    const updated = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updated.stock).toBe(variant.stock - 1);
  });

  it("rejects out of stock checkout", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: 0 } });
    const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({
      shippingName: "Customer Test",
      shippingPhone: "0900000000",
      shippingAddress: "1 Test Street",
      paymentMethod: "COD",
      items: [{ variantId: variant.id, quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it("tracks and returns order details", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const created = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "COD", items: [{ variantId: variant.id, quantity: 1 }] }).expect(201);
    await request(app).get(`/api/orders/track/${created.body.data.code}`).expect(200);
    await request(app).get(`/api/orders/${created.body.data.code}`).set("Authorization", `Bearer ${token}`).expect(200);
  });

  it("protects full order details from guests and non-owners", async () => {
    const token = await login();
    const adminToken = await login("admin.test@example.com", "admin123");
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const created = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "COD", items: [{ variantId: variant.id, quantity: 1 }] }).expect(201);

    await request(app).get(`/api/orders/${created.body.data.code}`).expect(401);
    await request(app).get(`/api/orders/${created.body.data.code}`).set("Authorization", `Bearer ${adminToken}`).expect(403);

    const tracking = await request(app).get(`/api/orders/track/${created.body.data.code}`).expect(200);
    expect(tracking.body.data).toEqual(expect.objectContaining({ code: created.body.data.code, status: "PENDING" }));
    expect(tracking.body.data.items).toBeUndefined();
    expect(tracking.body.data.shippingAddress).toBeUndefined();
    expect(tracking.body.data.shippingPhone).toBeUndefined();
  });

  it("marks online payment success and failure", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const created = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "VNPAY", items: [{ variantId: variant.id, quantity: 1 }] }).expect(201);
    const paid = await orderService.markOrderPaid(created.body.data.code, "TEST-PAID");
    expect(paid!.paymentStatus).toBe("PAID");
    const paidAgain = await orderService.markOrderPaid(created.body.data.code, "TEST-PAID-2");
    expect(paidAgain!.paymentStatus).toBe("PAID");
    const failedOrder = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "VNPAY", items: [{ variantId: variant.id, quantity: 1 }] }).expect(201);
    const failed = await orderService.markOrderPaymentFailed(failedOrder.body.data.code, "TEST-FAILED");
    expect(failed.paymentStatus).toBe("FAILED");
  });

  it("cancels pending order", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const created = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "COD", items: [{ variantId: variant.id, quantity: 1 }] });
    const res = await request(app).post(`/api/orders/${created.body.data.code}/cancel`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("rejects cancelling shipping order", async () => {
    const token = await login();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "customer.test@example.com" } });
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } }, include: { product: true } });
    const order = await prisma.order.create({
      data: {
        code: "MTF-SHIPPING-1",
        userId: user.id,
        shippingName: "Customer Test",
        shippingPhone: "0900000000",
        shippingAddress: "1 Test Street",
        subtotal: 100000,
        total: 130000,
        paymentMethod: "COD",
        status: OrderStatus.SHIPPING,
        items: { create: { variantId: variant.id, productName: variant.product.name, productSlug: variant.product.slug, variantName: "Ãƒâ€žÃ‚Âen / S", image: variant.product.thumbnail, price: 100000, quantity: 1, subtotal: 100000 } },
      },
    });
    const res = await request(app).post(`/api/orders/${order.code}/cancel`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});



