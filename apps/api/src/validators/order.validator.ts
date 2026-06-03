import { z } from "zod";
import { phoneSchema, quantitySchema } from "./common";

export const checkoutValidator = z.object({
  body: z.object({
    shippingName: z.string().min(2).max(100),
    shippingPhone: phoneSchema,
    shippingAddress: z.string().min(5).max(300),
    paymentMethod: z.enum(["COD", "VNPAY", "MOMO", "STRIPE", "BANK_TRANSFER"]),
    note: z.string().max(500).optional(),
    voucherCode: z.string().max(50).optional(),
    giftCardCode: z.string().max(50).optional(),
    pointsToUse: z.number().int().min(0).optional(),
    toDistrictId: z.number().int().optional(),
    toWardCode: z.string().optional(),
    items: z.array(z.object({ variantId: z.string().min(1), quantity: quantitySchema })).min(1),
  }),
});

export const orderCodeParamsValidator = z.object({ params: z.object({ code: z.string().min(3).max(50) }) });
