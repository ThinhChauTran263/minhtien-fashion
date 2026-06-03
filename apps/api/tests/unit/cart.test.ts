import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/config/database";
import { login } from "../helpers";

describe("Cart", () => {
  it("gets an empty cart for a new user", async () => {
    const token = await login();
    const res = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("adds item to cart", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const res = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it("increments duplicate item quantity", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });
    const res = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });
    expect(res.body.data.items[0].quantity).toBe(2);
  });

  it("updates quantity 0 and removes item", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const add = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 });
    const itemId = add.body.data.items[0].id;
    const res = await request(app).patch(`/api/cart/items/${itemId}`).set("Authorization", `Bearer ${token}`).send({ quantity: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("rejects adding above stock", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const res = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 99 });
    expect(res.status).toBe(400);
  });

  it("rejects invalid variant and update above stock", async () => {
    const token = await login();
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: "missing", quantity: 1 }).expect(404);
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const add = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 }).expect(200);
    await request(app).patch(`/api/cart/items/${add.body.data.items[0].id}`).set("Authorization", `Bearer ${token}`).send({ quantity: 99 }).expect(400);
  });

  it("removes item and clears cart", async () => {
    const token = await login();
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    const add = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 }).expect(200);
    await request(app).delete(`/api/cart/items/${add.body.data.items[0].id}`).set("Authorization", `Bearer ${token}`).expect(200);
    const addAgain = await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 }).expect(200);
    expect(addAgain.body.data.items).toHaveLength(1);
    const clear = await request(app).delete("/api/cart").set("Authorization", `Bearer ${token}`).expect(200);
    expect(clear.body.data.items).toHaveLength(0);
  });
});
