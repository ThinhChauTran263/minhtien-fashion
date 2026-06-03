import { PrismaClient, CollarType, Size, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting...");

  // Clean
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  await prisma.user.create({
    data: {
      email: "admin@minhtien.vn",
      passwordHash: adminHash,
      name: "Admin Minh Tien",
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "customer@example.com",
      passwordHash: customerHash,
      name: "Khách hàng demo",
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  });

  console.log("[Seed] Users created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
