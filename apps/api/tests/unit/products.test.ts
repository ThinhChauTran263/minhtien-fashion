import request from "supertest";
import { app } from "../../src/app";

describe("Products", () => {
  it("returns paginated products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("filters by collarType", async () => {
    const res = await request(app).get("/api/products").query({ collarType: "CO_CO" });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].collarType).toBe("CO_CO");
  });

  it("supports category, size, color and price filters", async () => {
    const res = await request(app).get("/api/products").query({ category: "polo", sizes: "S", colors: "Den", minPrice: 1, maxPrice: 200000 });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it("sorts products and exposes featured/search endpoints", async () => {
    await request(app).get("/api/products").query({ sort: "price_asc" }).expect(200);
    await request(app).get("/api/products").query({ sort: "price_desc" }).expect(200);
    await request(app).get("/api/products").query({ sort: "best_seller" }).expect(200);
    const featured = await request(app).get("/api/products/featured").expect(200);
    const newest = await request(app).get("/api/products/new-arrivals").expect(200);
    const search = await request(app).get("/api/products/search").query({ q: "polo" }).expect(200);
    expect(featured.body.data).toHaveLength(1);
    expect(newest.body.data).toHaveLength(1);
    expect(search.body.data).toHaveLength(1);
  });

  it("returns product by slug with variants", async () => {
    const res = await request(app).get("/api/products/polo-test");
    expect(res.status).toBe(200);
    expect(res.body.data.variants.length).toBeGreaterThan(0);
  });

  it("returns 404 for missing slug", async () => {
    const res = await request(app).get("/api/products/missing-product");
    expect(res.status).toBe(404);
  });
});

