import { Router } from "express";
import { blogService } from "../services/blog.service";

const router = Router();

// GET /api/blog/posts
router.get("/posts", async (req, res, next) => {
  try {
    const data = await blogService.getPosts({
      categorySlug: req.query.category as string,
      tag: req.query.tag as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Math.min(Number(req.query.limit), 100) : 12,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/categories
router.get("/categories", async (_req, res, next) => {
  try {
    const data = await blogService.getCategories();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/popular
router.get("/popular", async (_req, res, next) => {
  try {
    const data = await blogService.getPopularPosts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/posts/:slug
router.get("/posts/:slug", async (req, res, next) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug);
    const related = await blogService.getRelatedPosts(post.id, post.categoryId ?? "");
    res.json({ success: true, data: { post, related } });
  } catch (err) {
    next(err);
  }
});

export { router as blogRoutes };
