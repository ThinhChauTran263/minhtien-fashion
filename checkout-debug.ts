import dotenv from "dotenv";
import request from "supertest";
import bcrypt from "bcryptjs";
import { Role, CollarType, Size } from "@prisma/client";
dotenv.config({ path: "apps/api/.env" });

async function main() {
  const { app } = await import("./apps/api/src/app");
  const { prisma } = await import("./apps/api/src/config/database");
  await prisma.cartItem.deleteMany(); await prisma.cart.deleteMany(); await prisma.orderItem.deleteMany(); await prisma.order.deleteMany(); await prisma.productVariant.deleteMany(); await prisma.product.deleteMany(); await prisma.category.deleteMany(); await prisma.user.deleteMany();
  const user = await prisma.user.create({ data: { email: "customer.test@example.com", passwordHash: await bcrypt.hash("customer123", 12), name: "Customer Test", role: Role.CUSTOMER, emailVerified: true } });
  const category = await prisma.category.create({ data: { slug: "polo", name: "Polo", order: 1 } });
  const product = await prisma.product.create({ data: { slug: "polo-test", name: "Polo Test", description: "A test polo shirt", categoryId: category.id, collarType: CollarType.CO_CO, basePrice: 100000, salePrice: 90000, images: ["/images/polo-classic-1.svg"], thumbnail: "/images/polo-classic-1.svg", isFeatured: true, tags: ["polo"], variants: { create: [{ sku: "POLO-S-BLACK", size: Size.S, color: "Den", colorHex: "#000000", stock: 5, images: [] }] } }, include: { variants: true } });
  const login = await request(app).post("/api/auth/login").send({ email: "customer.test@example.com", password: "customer123" });
  const cookie = (login.headers["set-cookie"] as unknown as string[]).find((value) => value.startsWith("mtf_access_token="))!;
  const token = cookie.split(";")[0].slice("mtf_access_token=".length);
  const res = await request(app).post("/api/orders").set("Authorization", `Bearer ${token}`).send({ shippingName: "Customer Test", shippingPhone: "0900000000", shippingAddress: "1 Test Street", paymentMethod: "COD", items: [{ variantId: product.variants[0].id, quantity: 1 }] });
  console.log(res.status, JSON.stringify(res.body, null, 2));
  await prisma.$disconnect();
}
main();
