import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/database";
import { slugify, generateSku } from "../../utils/slug";
import { AppError } from "../../middlewares/error.middleware";
import { cacheService } from "../../services/cache.service";
import { searchQueue } from "../../config/queue";

const router = Router();

function enqueueProductSearchUpsert(productId: string) {
  return searchQueue.add(
    "upsertProduct",
    { type: "upsert_product", productId },
    { jobId: `search-product-${productId}` }
  );
}

function enqueueProductSearchDelete(productId: string) {
  return searchQueue.add(
    "deleteProduct",
    { type: "delete_product", productId },
    { jobId: `search-delete-product-${productId}` }
  );
}

// GET /api/admin/products
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const search = req.query.q as string;

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: true, variants: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  shortDesc: z.string().optional(),
  categoryId: z.string(),
  collarType: z.enum(["CO_CO", "CO_TRON"]),
  material: z.string().optional(),
  basePrice: z.number().int().min(0),
  salePrice: z.number().int().min(0).optional(),
  images: z.array(z.string()),
  thumbnail: z.string(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]),
        color: z.string(),
        colorHex: z.string(),
        stock: z.number().int().min(0),
        price: z.number().int().min(0).optional(),
        images: z.array(z.string()).default([]),
      })
    )
    .min(1),
});

// GET /api/admin/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, variants: true },
    });
    if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products
router.post("/", async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    let slug = slugify(data.name);

    // Ã„ÂÃ¡ÂºÂ£m bÃ¡ÂºÂ£o slug unique
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        shortDesc: data.shortDesc,
        categoryId: data.categoryId,
        collarType: data.collarType,
        material: data.material,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        images: data.images,
        thumbnail: data.thumbnail,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        tags: data.tags,
        variants: {
          create: data.variants.map((v) => ({
            sku: generateSku(data.collarType, v.color, v.size),
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: v.stock,
            price: v.price,
            images: v.images,
          })),
        },
      },
      include: { variants: true },
    });

    if (product.isFeatured) {
      await cacheService.del(cacheService.keys.featuredProducts);
    }
    await enqueueProductSearchUpsert(product.id);

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
});

// POST /api/admin/products/search/reindex
router.post("/search/reindex", async (_req, res, next) => {
  try {
    await searchQueue.add(
      "rebuildProductsIndex",
      { type: "rebuild_products_index" },
      { jobId: "search:rebuild-products-index" }
    );
    res.json({ success: true, message: "ÄÃ£ Ä‘Æ°a tÃ¡c vá»¥ rebuild search index vÃ o queue" });
  } catch (err) {
    next(err);
  }
});
// PATCH /api/admin/products/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id: req.params.id },
        include: { variants: true },
      });
      if (!existingProduct) throw new AppError("KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m", 404);

      const updatedProduct = await tx.product.update({
        where: { id: req.params.id },
        data: {
          name: data.name,
          description: data.description,
          shortDesc: data.shortDesc,
          categoryId: data.categoryId,
          collarType: data.collarType,
          material: data.material,
          basePrice: data.basePrice,
          salePrice: data.salePrice,
          images: data.images,
          thumbnail: data.thumbnail,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          tags: data.tags,
        },
      });

      if (data.variants) {
        const submittedVariantIds = data.variants
          .map((variant) => variant.id)
          .filter((id): id is string => Boolean(id));

        await Promise.all(
          existingProduct.variants
            .filter((variant) => !submittedVariantIds.includes(variant.id))
            .map((variant) => tx.productVariant.update({
              where: { id: variant.id },
              data: { isActive: false },
            }))
        );

        for (const variant of data.variants) {
          if (variant.id) {
            const result = await tx.productVariant.updateMany({
              where: { id: variant.id, productId: req.params.id },
              data: {
                size: variant.size,
                color: variant.color,
                colorHex: variant.colorHex,
                stock: variant.stock,
                price: variant.price,
                images: variant.images,
                isActive: true,
              },
            });
            if (result.count === 0) {
              throw new AppError("Biáº¿n thá»ƒ khÃ´ng thuá»™c sáº£n pháº©m nÃ y", 400);
            }
          } else {
            await tx.productVariant.create({
              data: {
                productId: req.params.id,
                sku: generateSku(data.collarType ?? existingProduct.collarType, variant.color, variant.size),
                size: variant.size,
                color: variant.color,
                colorHex: variant.colorHex,
                stock: variant.stock,
                price: variant.price,
                images: variant.images,
              },
            });
          }
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: updatedProduct.id },
        include: { variants: true, category: true },
      });
    });
    // Invalidate cache
    await cacheService.del(
      cacheService.keys.productBySlug(product.slug),
      cacheService.keys.featuredProducts
    );
    await enqueueProductSearchUpsert(product.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id (soft delete)
router.delete("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await cacheService.del(
      cacheService.keys.productBySlug(product.slug),
      cacheService.keys.featuredProducts
    );
    await enqueueProductSearchDelete(product.id);
    res.json({ success: true, message: "Ã„ÂÃƒÂ£ Ã¡ÂºÂ©n sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m" });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id/variants/:vid
router.patch("/:id/variants/:vid", async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.update({
      where: { id: req.params.vid },
      data: {
        stock: req.body.stock,
        price: req.body.price,
        isActive: req.body.isActive,
      },
      include: { product: { select: { slug: true } } },
    });
    await cacheService.del(
      cacheService.keys.productBySlug(variant.product.slug),
      cacheService.keys.featuredProducts
    );
    await enqueueProductSearchUpsert(variant.productId);
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
});

export { router as adminProductRoutes };






