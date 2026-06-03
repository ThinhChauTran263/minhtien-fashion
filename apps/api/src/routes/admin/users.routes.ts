import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { hashPassword } from "../../utils/hash";
import { redis } from "../../config/redis";

const router = Router();

// GET /api/admin/users
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const search = req.query.q as string;

    const includeDeleted = req.query.includeDeleted === "true";
    const locked = req.query.locked as string | undefined;

    const where: any = { role: "CUSTOMER", ...(includeDeleted ? {} : { deletedAt: null }) };
    if (locked === "true") where.isLocked = true;
    if (locked === "false") where.isLocked = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isLocked: true,
          lockedAt: true,
          lockReason: true,
          deletedAt: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id
router.get("/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isLocked: true,
        lockedAt: true,
        lockReason: true,
        deletedAt: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            code: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!user) {
      throw new AppError("KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng", 404);
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20).optional().or(z.literal("")),
  password: z.string().min(6).max(100).optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional().or(z.literal("")),
  password: z.string().min(6).max(100).optional(),
});

// POST /api/admin/users
router.post("/", async (req, res, next) => {
  try {
    const data = createCustomerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
      select: { id: true, email: true, phone: true },
    });
    if (existing) throw new AppError("Email hoặc số điện thoại đã tồn tại", 400);

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: "CUSTOMER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isLocked: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// PATCH /api/admin/users/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const data = updateCustomerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existingUser || existingUser.role !== "CUSTOMER") throw new AppError("Không tìm thấy khách hàng", 404);

    if (data.email || data.phone) {
      const duplicate = await prisma.user.findFirst({
        where: {
          id: { not: req.params.id },
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.phone ? [{ phone: data.phone }] : []),
          ],
        },
        select: { id: true },
      });
      if (duplicate) throw new AppError("Email hoặc số điện thoại đã tồn tại", 400);
    }

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isLocked: true, lockedAt: true, lockReason: true, deletedAt: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

// PATCH /api/admin/users/:id/lock
router.patch("/:id/lock", async (req: AuthRequest, res, next) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : null;
    const user = await prisma.user.update({
      where: { id: req.params.id, role: "CUSTOMER" },
      data: { isLocked: true, lockedAt: new Date(), lockReason: reason },
      select: { id: true, name: true, email: true, phone: true, role: true, isLocked: true, lockedAt: true, lockReason: true },
    });
    await redis.setex(`revoked:refresh:${user.id}`, 60 * 60 * 24 * 30, req.user?.id ?? "admin-lock");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/unlock
router.patch("/:id/unlock", async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id, role: "CUSTOMER" },
      data: { isLocked: false, lockedAt: null, lockReason: null },
      select: { id: true, name: true, email: true, phone: true, role: true, isLocked: true, lockedAt: true, lockReason: true },
    });
    await redis.del(`revoked:refresh:${user.id}`);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id, role: "CUSTOMER" },
      data: { deletedAt: new Date(), isLocked: true, lockedAt: new Date(), lockReason: "Deleted by admin" },
      select: { id: true, email: true },
    });
    await redis.setex(`revoked:refresh:${user.id}`, 60 * 60 * 24 * 30, req.user?.id ?? "admin-delete");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch("/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["CUSTOMER", "ADMIN", "STAFF"];
    if (!validRoles.includes(role)) {
      throw new AppError("Role khÃ´ng há»£p lá»‡", 400);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export { router as adminUserRoutes };
