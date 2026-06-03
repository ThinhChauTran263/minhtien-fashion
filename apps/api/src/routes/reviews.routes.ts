import { Router } from "express";
import { z } from "zod";
import { reviewService } from "../services/review.service";
import { authMiddleware, optionalAuth, AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(5, "Nội dung tối thiểu 5 ký tự").max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  content: z.string().min(5).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

// GET /api/reviews/products/:slug - public reviews of a product
router.get("/products/:slug", async (req, res, next) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 10;
    const data = await reviewService.getProductReviews(req.params.slug, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/eligibility/:slug - check if logged-in user can review
router.get("/eligibility/:slug", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        data: { canReview: false, hasReviewed: false, hasPurchased: false },
      });
    }
    const data = await reviewService.getReviewEligibility(req.user.id, req.params.slug);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post("/", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const { productId, ...rest } = data;
    const review = await reviewService.createReview(req.user!.id, productId, rest);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// PATCH /api/reviews/:id
router.patch("/:id", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const review = await reviewService.updateReview(req.user!.id, req.params.id, data);
    res.json({ success: true, data: review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// DELETE /api/reviews/:id
router.delete("/:id", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await reviewService.deleteReview(req.user!.id, req.params.id);
    res.json({ success: true, message: "Đã xoá review" });
  } catch (err) {
    next(err);
  }
});

export { router as reviewRoutes };
