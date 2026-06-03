import { randomUUID } from "crypto";
import request from "supertest";
import { app } from "../../../src/app";
import { prisma } from "../../../src/config/database";
import { searchQueue } from "../../../src/config/queue";
import { login } from "../../helpers";

jest.mock("../../../src/config/queue", () => {
  const actual = jest.requireActual("../../../src/config/queue");
  return {
    ...actual,
    searchQueue: { add: jest.fn() },
  };
});

describe("Admin product search indexing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("enqueues a Meilisearch upsert when admin creates a product", async () => {
    const token = await login("admin.test@example.com", "admin123");
    const category = await prisma.category.findFirstOrThrow();

    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `Indexed Product ${randomUUID()}`,
        description: "Created by test",
        categoryId: category.id,
        collarType: "CO_CO",
        basePrice: 120000,
        images: ["/images/polo-classic-1.svg"],
        thumbnail: "/images/polo-classic-1.svg",
        tags: ["indexed"],
        variants: [{ size: "S", color: "Den", colorHex: "#000000", stock: 3, images: [] }],
      })
      .expect(201);

    expect(searchQueue.add).toHaveBeenCalledWith(
      "upsertProduct",
      { type: "upsert_product", productId: res.body.data.id },
      { jobId: `search-product-${res.body.data.id}` }
    );
  });

  it("enqueues a Meilisearch delete when admin soft-deletes a product", async () => {
    const token = await login("admin.test@example.com", "admin123");
    const product = await prisma.product.findFirstOrThrow({ where: { slug: "polo-test" } });

    await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(searchQueue.add).toHaveBeenCalledWith(
      "deleteProduct",
      { type: "delete_product", productId: product.id },
      { jobId: `search-delete-product-${product.id}` }
    );
  });
});
