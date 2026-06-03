import { z } from "zod";
import { priceSchema, sizeSchema, slugSchema } from "./common";

const variantSchema = z.object({
  sku: z.string().min(1).max(80),
  size: sizeSchema,
  color: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  stock: z.number().int().min(0),
  price: priceSchema.optional(),
  images: z.array(z.string()).optional(),
});

export const createProductValidator = z.object({
  body: z.object({
    slug: slugSchema,
    name: z.string().min(2).max(160),
    description: z.string().min(1),
    shortDesc: z.string().max(240).optional(),
    categoryId: z.string().min(1),
    collarType: z.enum(["CO_CO", "CO_TRON"]),
    material: z.string().max(120).optional(),
    basePrice: priceSchema,
    salePrice: priceSchema.optional(),
    images: z.array(z.string()).default([]),
    thumbnail: z.string().min(1),
    isFeatured: z.boolean().optional(),
    tags: z.array(z.string()).default([]),
    variants: z.array(variantSchema).optional(),
  }),
});

export const updateProductValidator = z.object({ body: createProductValidator.shape.body.partial(), params: z.object({ id: z.string().min(1) }) });
