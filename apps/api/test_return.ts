import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const ret = await prisma.returnRequest.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Return request in DB:', ret);
}
run().finally(() => prisma.$disconnect());
