import bcrypt from "bcryptjs";
import { PrismaClient, CollarType, Role, Size } from "@prisma/client";
const { prisma: appPrisma } = require("../src/config/database");
const { redis } = require("../src/config/redis");
const { closeQueues } = require("../src/config/queue");

const prisma = new PrismaClient();

export async function resetTestDb() {
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.pointHistory.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.stockNotification.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.flashSaleItem.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.giftCard.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.sizeGuide.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();

  const customer = await prisma.user.create({
    data: {
      email: "customer.test@example.com",
      passwordHash: await bcrypt.hash("customer123", 12),
      name: "Customer Test",
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin.test@example.com",
      passwordHash: await bcrypt.hash("admin123", 12),
      name: "Admin Test",
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  const category = await prisma.category.create({ data: { slug: "polo", name: "Polo", order: 1 } });
  const product = await prisma.product.create({
    data: {
      slug: "polo-test",
      name: "Polo Test",
      description: "A test polo shirt",
      categoryId: category.id,
      collarType: CollarType.CO_CO,
      basePrice: 100000,
      salePrice: 90000,
      images: ["/images/polo-classic-1.svg"],
      thumbnail: "/images/polo-classic-1.svg",
      isFeatured: true,
      tags: ["polo"],
      variants: {
        create: [
          { sku: "POLO-S-BLACK", size: Size.S, color: "Den", colorHex: "#000000", stock: 5, images: [] },
          { sku: "POLO-M-BLACK", size: Size.M, color: "Den", colorHex: "#000000", stock: 0, images: [] },
        ],
      },
    },
    include: { variants: true },
  });

  return { customer, admin, category, product, variant: product.variants[0], outOfStockVariant: product.variants[1] };
}

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await appPrisma.$disconnect();
  await closeQueues();
  redis.disconnect();
});





