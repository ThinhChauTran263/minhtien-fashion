import { Router } from "express";
import { productService } from "../services/product.service";

const router = Router();

// GET /api/products - Danh sách + filter
router.get("/", async (req, res, next) => {
  try {
    const filter = {
      collarType: req.query.collarType as any,
      ids: req.query.ids ? (req.query.ids as string).split(",").filter(Boolean) : undefined,
      category: req.query.category as string,
      sizes: req.query.sizes ? (req.query.sizes as string).split(",") : undefined,
      colors: req.query.colors ? (req.query.colors as string).split(",") : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sort: req.query.sort as any,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Math.min(Number(req.query.limit), 100) : 20,
      search: req.query.q as string,
    };
    const result = await productService.getProducts(filter);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/related
router.get("/:id/related", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 8;
    const products = await productService.getRelatedProducts(req.params.id, limit);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/cross-sell
router.get("/:id/cross-sell", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 4;
    const products = await productService.getCrossSellProducts(req.params.id, limit);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
router.get("/featured", async (_req, res, next) => {
  try {
    const products = await productService.getFeatured();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/new-arrivals
router.get("/new-arrivals", async (_req, res, next) => {
  try {
    const products = await productService.getNewArrivals();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/search?q=
router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const products = await productService.search(q);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const product = await productService.getBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

export { router as productRoutes };
