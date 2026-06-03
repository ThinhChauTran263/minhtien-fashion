import { z } from "zod";
import { phoneSchema } from "./common";

export const registerValidator = z.object({
  body: z.object({
    email: z.string().email("Email không hợp lệ").toLowerCase(),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(100),
    name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100),
    phone: phoneSchema.optional(),
  }),
});

export const loginValidator = z.object({
  body: z.object({ email: z.string().email("Email không hợp lệ").toLowerCase(), password: z.string().min(1) }),
});

export const refreshValidator = z.object({ body: z.object({ refreshToken: z.string().min(10).optional() }) });
export const forgotPasswordValidator = z.object({ body: z.object({ email: z.string().email("Email không hợp lệ").toLowerCase() }) });
export const resetPasswordValidator = z.object({ body: z.object({ token: z.string().min(10), newPassword: z.string().min(6).max(100) }) });
