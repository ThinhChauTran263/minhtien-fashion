import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { hashPassword, comparePassword } from "../utils/hash";
import { AppError } from "../middlewares/error.middleware";
import { validate } from "../middlewares/validate.middleware";
import { addressValidator, changePasswordValidator, updateAddressValidator, updateProfileValidator } from "../validators/user.validator";

const router = Router();
router.use(authMiddleware);

// GET /api/users/profile
router.get("/profile", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile
router.patch("/profile", validate(updateProfileValidator), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/password
router.patch("/password", validate(changePasswordValidator), async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.passwordHash) throw new AppError("Tài khoản không có mật khẩu", 400);

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw new AppError("Mật khẩu hiện tại không đúng", 400);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/addresses
router.get("/addresses", async (req: AuthRequest, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: "desc" },
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/addresses
router.post("/addresses", validate(addressValidator), async (req: AuthRequest, res, next) => {
  try {
    const data = req.body;

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/addresses/:id
router.patch("/addresses/:id", validate(updateAddressValidator), async (req: AuthRequest, res, next) => {
  try {
    const data = req.body;

    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!address) throw new AppError("Địa chỉ không tồn tại", 404);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/addresses/:id
router.delete("/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.address.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ success: true, message: "Đã xoá địa chỉ" });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/wishlist
router.get("/wishlist", async (req: AuthRequest, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          select: { id: true, slug: true, name: true, thumbnail: true, basePrice: true, salePrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/wishlist/:productId
router.post("/wishlist/:productId", async (req: AuthRequest, res, next) => {
  try {
    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } },
      create: { userId: req.user!.id, productId: req.params.productId },
      update: {},
    });
    res.json({ success: true, message: "Đã thêm vào yêu thích" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/wishlist/:productId
router.delete("/wishlist/:productId", async (req: AuthRequest, res, next) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user!.id, productId: req.params.productId },
    });
    res.json({ success: true, message: "Đã bỏ yêu thích" });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/my-data - xuất toàn bộ dữ liệu cá nhân (NĐ 13/2023)
router.get("/my-data", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        points: true,
        createdAt: true,
        addresses: true,
        orders: { include: { items: true } },
        reviews: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/request-data-deletion - yêu cầu xoá tài khoản
router.post("/request-data-deletion", async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { deletionRequestedAt: new Date() },
    });
    res.json({
      success: true,
      message: "Yêu cầu xoá đã được ghi nhận. Tài khoản sẽ bị xoá sau 30 ngày.",
    });
  } catch (err) {
    next(err);
  }
});

export { router as userRoutes };
