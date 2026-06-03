import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.user.count();
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true, role: true } });
  console.log("USER_COUNT=" + count);
  console.log("ADMINS=" + JSON.stringify(admins));
}
main().finally(() => prisma.$disconnect());
