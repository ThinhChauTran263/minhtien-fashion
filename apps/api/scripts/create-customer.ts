import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("123456", 12);
  const u = await prisma.user.upsert({
    where: { email: "customer@minhtien.vn" },
    update: { passwordHash: hash, isLocked: false, lockedAt: null, lockReason: null },
    create: {
      email: "customer@minhtien.vn",
      passwordHash: hash,
      name: "Khách hàng Test",
      role: "CUSTOMER",
      emailVerified: true,
      points: 0,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log("DONE:", JSON.stringify(u));
}
main().finally(() => prisma.$disconnect());
