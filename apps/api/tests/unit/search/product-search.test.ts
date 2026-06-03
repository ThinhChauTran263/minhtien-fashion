import { prisma } from "../../../src/config/database";
import { buildProductSearchDocument, productSearchService } from "../../../src/search/product-search.service";
import { productService } from "../../../src/services/product.service";

describe("Product search guard rails", () => {
  it("builds Meilisearch documents from active products only", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { slug: "polo-test" } });

    const document = await buildProductSearchDocument(product.id);

    expect(document).toEqual(
      expect.objectContaining({
        id: product.id,
        slug: "polo-test",
        name: "Polo Test",
        tags: ["polo"],
        categorySlug: "polo",
        sizes: expect.arrayContaining(["S", "M"]),
        colors: expect.arrayContaining(["Den"]),
        inStock: true,
      })
    );
  });

  it("returns null for inactive products so they are removed from the search index", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { slug: "polo-test" } });
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });

    await expect(buildProductSearchDocument(product.id)).resolves.toBeNull();
  });

  it("does not call PostgreSQL raw search when Meilisearch is disabled", async () => {
    const rawSearchSpy = jest.spyOn(prisma, "$queryRaw");

    const results = await productService.search("polo", 5);

    expect(results).toHaveLength(1);
    expect(rawSearchSpy).not.toHaveBeenCalled();
  });

  it("no-ops index writes safely when Meilisearch is not configured", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { slug: "polo-test" } });

    await expect(productSearchService.upsertProduct(product.id)).resolves.toBeUndefined();
    await expect(productSearchService.deleteProduct(product.id)).resolves.toBeUndefined();
  });
});
