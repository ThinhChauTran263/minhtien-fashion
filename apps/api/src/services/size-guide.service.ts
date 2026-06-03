import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const defaultSizeGuideData = {
  S: { chest: 96, length: 68, shoulder: 42, weight: "50-58kg", height: "160-165cm" },
  M: { chest: 100, length: 70, shoulder: 44, weight: "58-65kg", height: "165-170cm" },
  L: { chest: 104, length: 72, shoulder: 46, weight: "65-72kg", height: "170-175cm" },
  XL: { chest: 108, length: 74, shoulder: 48, weight: "72-80kg", height: "175-180cm" },
  XXL: { chest: 112, length: 76, shoulder: 50, weight: "80-90kg", height: "180-185cm" },
};

export const sizeGuideService = {
  async getSizeGuide(categoryId?: string | null) {
    const guide = await prisma.sizeGuide.findFirst({
      where: categoryId ? { categoryId } : { categoryId: null },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (guide || !categoryId) return guide;

    return prisma.sizeGuide.findFirst({
      where: { categoryId: null },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  },

  async upsertSizeGuide(categoryId: string | null, data: Prisma.InputJsonValue) {
    if (categoryId) {
      return prisma.sizeGuide.upsert({
        where: { categoryId },
        create: { categoryId, data },
        update: { data },
      });
    }

    const existing = await prisma.sizeGuide.findFirst({ where: { categoryId: null } });
    if (existing) {
      return prisma.sizeGuide.update({ where: { id: existing.id }, data: { data } });
    }
    return prisma.sizeGuide.create({ data: { categoryId: null, data } });
  },
};
