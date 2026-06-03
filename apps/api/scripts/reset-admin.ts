import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("admin123", 12);
  const u = await prisma.user.update({
    where: { email: "admin@minhtien.vn" },
    data: { passwordHash: hash, role: "ADMIN", isLocked: false, lockedAt: null, lockReason: null },
    select: { id: true, email: true, role: true },
  });
  console.log("DONE:", JSON.stringify(u));
}
main().finally(() => prisma.$disconnect());
