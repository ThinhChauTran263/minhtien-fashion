import { prisma } from "../config/database";

export const locationService = {
  async search(query: string) {
    if (!query || query.length < 2) return [];

    const wards = await prisma.ward.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      include: {
        district: {
          include: {
            province: true,
          },
        },
      },
      take: 20,
    });

    return wards.map((w) => ({
      wardCode: w.code,
      districtId: w.districtId,
      provinceId: w.district.provinceId,
      wardName: w.name,
      districtName: w.district.name,
      provinceName: w.district.province.name,
      fullAddress: `${w.name}, ${w.district.name}, ${w.district.province.name}`,
    }));
  },

  async getProvinces() {
    return prisma.province.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async getWardsByProvince(provinceId: number) {
    const wards = await prisma.ward.findMany({
      where: {
        district: {
          provinceId: provinceId
        }
      },
      include: {
        district: true
      },
      orderBy: { name: 'asc' }
    });

    return wards.map(w => ({
      code: w.code,
      name: w.name,
      districtId: w.districtId,
      districtName: w.district.name
    }));
  }
};
