import { z } from "zod";
import { quantitySchema } from "./common";

export const addCartItemValidator = z.object({
  body: z.object({ variantId: z.string().min(1), quantity: quantitySchema }),
});

export const updateCartItemValidator = z.object({
  body: z.object({ quantity: z.number().int().min(0).max(99) }),
  params: z.object({ id: z.string().min(1) }),
});
