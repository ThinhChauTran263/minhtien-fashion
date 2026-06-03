import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const { MeiliSearch } = require("meilisearch");

dotenv.config();

const prisma = new PrismaClient();
const MEILI_INDEX = process.env.MEILISEARCH_PRODUCTS_INDEX ?? "products";
const BATCH_SIZE = Number(process.env.MEILISEARCH_SYNC_BATCH_SIZE ?? 500);

interface ProductMeiliDocument {
  id: string;
  name: string;
  tags: string[];
  description: string;
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function main() {
  const host = requireEnv("MEILISEARCH_HOST");
  const apiKey = process.env.MEILISEARCH_API_KEY ?? "";
  const client = new MeiliSearch({ host, apiKey });
  const index = client.index(MEILI_INDEX);

  await index.updateSettings({
    searchableAttributes: ["name", "tags", "description"],
    displayedAttributes: ["id", "name", "tags", "description"],
    filterableAttributes: ["tags"],
  });

  let cursor: string | undefined;
  let totalSynced = 0;

  while (true) {
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        tags: true,
        description: true,
      },
    });

    if (products.length === 0) break;

    const documents: ProductMeiliDocument[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      tags: product.tags,
      description: product.description,
    }));

    await index.addDocuments(documents, { primaryKey: "id" });
    totalSynced += documents.length;
    cursor = products[products.length - 1].id;
    console.log(`[Meilisearch] Synced ${totalSynced} products...`);

    if (products.length < BATCH_SIZE) break;
  }

  console.log(`[Meilisearch] Sync completed. Total products synced: ${totalSynced}`);
}

main()
  .catch((error) => {
    console.error("[Meilisearch] Product sync failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
