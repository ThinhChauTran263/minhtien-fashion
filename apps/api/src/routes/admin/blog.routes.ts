import { Router } from "express";
import { z } from "zod";
import { blogService } from "../../services/blog.service";
import { prisma } from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();

const postSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  thumbnail: z.string().min(1),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  relatedProductIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

// GET /api/admin/blog/posts
router.get("/posts", async (req, res, next) => {
  try {
    const data = await blogService.adminList({
      categoryId: req.query.categoryId as string,
      status: req.query.status as string,
      q: req.query.q as string,
      page: req.query.page ? Number(req.query.page) : 1,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/blog/categories
router.post("/categories", async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) throw new AppError("Thiáº¿u tÃªn hoáº·c slug", 400);
    const cat = await prisma.blogCategory.create({ data: { name, slug } });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/blog/posts
router.post("/posts", async (req: AuthRequest, res, next) => {
  try {
    const data = postSchema.parse(req.body);
    const post = await blogService.create(req.user!.id, data);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// PATCH /api/admin/blog/posts/:id
router.patch("/posts/:id", async (req, res, next) => {
  try {
    const post = await blogService.update(req.params.id, req.body);
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/blog/posts/:id
router.delete("/posts/:id", async (req, res, next) => {
  try {
    await blogService.remove(req.params.id);
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ bÃ i viáº¿t" });
  } catch (err) {
    next(err);
  }
});

export { router as adminBlogRoutes };