import { z } from "zod";
import { phoneSchema } from "./common";

const avatarSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .nullable()
  .optional();

export const updateProfileValidator = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    avatar: avatarSchema,
  }),
});
export const changePasswordValidator = z.object({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6).max(100) }) });
export const addressValidator = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100),
    phone: phoneSchema,
    province: z.string().min(1).max(80),
    district: z.string().min(1).max(80),
    ward: z.string().min(1).max(80),
    street: z.string().min(1).max(160),
    isDefault: z.boolean().optional(),
  }),
});
export const updateAddressValidator = z.object({ body: addressValidator.shape.body.partial(), params: z.object({ id: z.string().min(1) }) });
