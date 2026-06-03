import { env } from "../config/env";
import { prisma } from "../config/database";

export interface ProductSearchDocument {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc?: string | null;
  thumbnail: string;
  basePrice: number;
  salePrice?: number | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  collarType: string;
  material?: string | null;
  tags: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  isFeatured: boolean;
  soldCount: number;
  rating: number;
  reviewCount: number;
  createdAt: number;
}

const PRODUCTS_INDEX = "products";
function createMeiliClient() {
  if (!env.meilisearch.host) return null;
  const { MeiliSearch } = require("meilisearch");
  return new MeiliSearch({ host: env.meilisearch.host, apiKey: env.meilisearch.apiKey });
}

const meiliClient = createMeiliClient();

const productsIndex = meiliClient?.index(PRODUCTS_INDEX);

export function isMeilisearchEnabled() {
  return Boolean(productsIndex);
}

export async function configureProductSearchIndex() {
  if (!productsIndex) return;

  await productsIndex.updateSettings({
    searchableAttributes: ["name", "shortDesc", "description", "tags", "categoryName", "colors", "material"],
    filterableAttributes: ["categorySlug", "collarType", "sizes", "colors", "inStock", "isFeatured"],
    sortableAttributes: ["basePrice", "soldCount", "createdAt", "rating"],
    displayedAttributes: [
      "id",
      "slug",
      "name",
      "thumbnail",
      "basePrice",
      "salePrice",
      "categorySlug",
      "categoryName",
      "collarType",
      "tags",
      "sizes",
      "colors",
      "inStock",
      "soldCount",
      "rating",
      "reviewCount",
    ],
  });
}

export async function buildProductSearchDocument(productId: string): Promise<ProductSearchDocument | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      variants: {
        where: { isActive: true },
        select: { size: true, color: true, stock: true, reserved: true },
      },
    },
  });

  if (!product || !product.isActive || product.deletedAt) return null;

  const availableVariants = product.variants.filter((variant) => variant.stock - variant.reserved > 0);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDesc: product.shortDesc,
    thumbnail: product.thumbnail,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice == null ? null : Number(product.salePrice),
    categoryId: product.category.id,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    collarType: product.collarType,
    material: product.material,
    tags: product.tags,
    sizes: Array.from(new Set(product.variants.map((variant) => variant.size))),
    colors: Array.from(new Set(product.variants.map((variant) => variant.color))),
    inStock: availableVariants.length > 0,
    isFeatured: product.isFeatured,
    soldCount: product.soldCount,
    rating: product.rating,
    reviewCount: product.reviewCount,
    createdAt: product.createdAt.getTime(),
  };
}

function buildMeiliFilter(filters: { category?: string; collarType?: string }) {
  const clauses: string[] = [];
  if (filters.category) clauses.push(`categorySlug = "${filters.category.replace(/"/g, "\\\"")}"`);
  if (filters.collarType) clauses.push(`collarType = "${filters.collarType.replace(/"/g, "\\\"")}"`);
  return clauses.length ? clauses : undefined;
}

function buildMeiliSort(sort?: string) {
  switch (sort) {
    case "price_asc":
      return ["basePrice:asc"];
    case "price_desc":
      return ["basePrice:desc"];
    case "newest":
      return ["createdAt:desc"];
    case "best_seller":
      return ["soldCount:desc"];
    default:
      return undefined;
  }
}

export const productSearchService = {
  async upsertProduct(productId: string) {
    if (!productsIndex) return;
    const document = await buildProductSearchDocument(productId);
    if (!document) {
      await productsIndex.deleteDocument(productId).catch(() => undefined);
      return;
    }
    await productsIndex.addDocuments([document], { primaryKey: "id" });
  },

  async deleteProduct(productId: string) {
    if (!productsIndex) return;
    await productsIndex.deleteDocument(productId).catch(() => undefined);
  },

  async rebuildProductsIndex() {
    if (!productsIndex) return;
    await configureProductSearchIndex();

    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });

    const documents = (
      await Promise.all(products.map((product) => buildProductSearchDocument(product.id)))
    ).filter((document): document is ProductSearchDocument => Boolean(document));

    if (documents.length > 0) {
      await productsIndex.addDocuments(documents, { primaryKey: "id" });
    }
  },

  async searchProducts(query: string, options: { limit?: number; page?: number; category?: string; collarType?: string; sort?: string } = {}) {
    if (!productsIndex) return null;

    const limit = options.limit ?? 10;
    const page = options.page ?? 1;
    const offset = (page - 1) * limit;
    const result = await productsIndex.search(query, {
      limit,
      offset,
      filter: buildMeiliFilter(options),
      sort: buildMeiliSort(options.sort),
    });

    return {
      items: result.hits,
      total: result.estimatedTotalHits ?? result.hits.length,
      page,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits ?? result.hits.length) / limit),
    };
  },

  async bootstrap() {
    await configureProductSearchIndex();
  },
};


