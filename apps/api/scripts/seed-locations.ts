import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching location data from provinces.open-api.vn...");
  
  const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
  if (!res.ok) {
    throw new Error("Failed to fetch locations");
  }

  const provinces = await res.json();
  console.log(`Fetched ${provinces.length} provinces.`);

  console.log("Clearing old data...");
  await prisma.ward.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  console.log("Inserting provinces, districts, and wards...");
  for (const p of provinces) {
    const province = await prisma.province.create({
      data: {
        id: p.code,
        name: p.name,
      },
    });

    for (const d of p.districts) {
      const district = await prisma.district.create({
        data: {
          id: d.code,
          name: d.name,
          provinceId: province.id,
        },
      });

      const wardData = d.wards.map((w: any) => ({
        code: String(w.code),
        name: w.name,
        districtId: district.id,
      }));

      if (wardData.length > 0) {
        await prisma.ward.createMany({
          data: wardData,
        });
      }
    }
  }

  console.log("Location seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
