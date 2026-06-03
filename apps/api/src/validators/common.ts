import { z } from "zod";

export const phoneSchema = z.string().regex(/^0\d{9}$/, "Số điện thoại Việt Nam phải gồm 10 số và bắt đầu bằng 0");
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");
export const priceSchema = z.number().nonnegative("Giá phải lớn hơn hoặc bằng 0");
export const quantitySchema = z.number().int().min(1).max(99);
export const sizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
