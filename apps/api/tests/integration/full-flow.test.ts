import { randomUUID } from "crypto";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/config/database";
import { login } from "../helpers";

describe("Integration flows", () => {
  it("registers, logs in, adds to cart, and checks out", async () => {
    await request(app).post("/api/auth/register").send({ email: "flow@example.com", password: "123456", name: "Flow User" }).expect(201);
    const token = await login("flow@example.com", "123456");
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { stock: { gt: 0 } } });
    await request(app).post("/api/cart/items").set("Authorization", `Bearer ${token}`).send({ variantId: variant.id, quantity: 1 }).expect(200);
    const order = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).set("x-idempotency-key", randomUUID()).send({ shippingName: "Flow User", shippingPhone: "0900000000", shippingAddress: "1 Flow Street", paymentMethod: "COD", items: [{ variantId: variant.id, quantity: 1 }] }).expect(201);
    expect(order.body.data.code).toMatch(/^MTF-/);
  });

  it("allows admin to create product and see it in list", async () => {
    const token = await login("admin.test@example.com", "admin123");
    const category = await prisma.category.findFirstOrThrow();
    await request(app).post("/api/admin/products").set("Authorization", `Bearer ${token}`).send({ slug: "admin-created", name: "Admin Created", description: "Created by admin", categoryId: category.id, collarType: "CO_CO", basePrice: 120000, images: ["/images/polo-classic-1.svg"], thumbnail: "/images/polo-classic-1.svg", tags: [], variants: [{ sku: "ADMIN-S", size: "S", color: "Ãƒâ€žÃ‚Âen", colorHex: "#000000", stock: 3, images: [] }] }).expect(201);
    const products = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${token}`).expect(200);
    expect(products.body.data.items.some((product: any) => product.slug === "admin-created")).toBe(true);
  });
});



