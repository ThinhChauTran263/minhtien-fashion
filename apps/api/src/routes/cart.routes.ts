import { Router } from "express";
import { cartService } from "../services/cart.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { addCartItemValidator, updateCartItemValidator } from "../validators/cart.validator";

const router = Router();
router.use(authMiddleware);

// GET /api/cart
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const cart = await cartService.getCart(req.user!.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items
router.post("/items", validate(addCartItemValidator), async (req: AuthRequest, res, next) => {
  try {
    const cart = await cartService.addItem(req.user!.id, req.body.variantId, req.body.quantity);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/items/:id
router.patch("/items/:id", validate(updateCartItemValidator), async (req: AuthRequest, res, next) => {
  try {
    const cart = await cartService.updateItem(req.user!.id, req.params.id, req.body.quantity);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:id
router.delete("/items/:id", async (req: AuthRequest, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user!.id, req.params.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart
router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user!.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
});

export { router as cartRoutes };
