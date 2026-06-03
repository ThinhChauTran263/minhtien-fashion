import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { emailQueueService } from "../services/email-queue.service";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@minhtien.vn";

const createSchema = z.object({
  requestType: z.enum(["CUSTOM", "BULK"]).optional().default("CUSTOM"),
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(100),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại phải gồm 10 số và bắt đầu bằng 0"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(100000).optional(),
  requirements: z.string().trim().min(10, "Vui lòng mô tả yêu cầu (tối thiểu 10 ký tự)").max(2000),
});

// POST /api/tailoring — khách gửi yêu cầu đặt may
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const request = await prisma.tailoringRequest.create({
      data: {
        requestType: data.requestType,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        quantity: data.quantity ?? null,
        requirements: data.requirements,
      },
    });

    const isBulk = data.requestType === "BULK";
    const typeLabel = isBulk ? "Đặt may số lượng lớn (đồng phục/team building)" : "Đặt may theo yêu cầu";

    // Gửi email thông báo cho admin (qua hàng đợi để không block response)
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">${typeLabel}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#737373;width:140px;">Họ tên</td><td style="padding:8px 0;font-weight:600;">${data.name}</td></tr>
          <tr><td style="padding:8px 0;color:#737373;">Số điện thoại</td><td style="padding:8px 0;font-weight:600;">${data.phone}</td></tr>
          ${data.email ? `<tr><td style="padding:8px 0;color:#737373;">Email</td><td style="padding:8px 0;">${data.email}</td></tr>` : ""}
          ${data.company ? `<tr><td style="padding:8px 0;color:#737373;">Công ty/Đội nhóm</td><td style="padding:8px 0;font-weight:600;">${data.company}</td></tr>` : ""}
          ${data.quantity ? `<tr><td style="padding:8px 0;color:#737373;">Số lượng dự kiến</td><td style="padding:8px 0;font-weight:600;">${data.quantity} áo</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#737373;vertical-align:top;">Yêu cầu</td><td style="padding:8px 0;white-space:pre-line;">${data.requirements.replace(/</g, "&lt;")}</td></tr>
        </table>
        <p style="margin-top:16px;color:#737373;font-size:13px;">Mã yêu cầu: ${request.id}</p>
        <p style="color:#737373;font-size:13px;">Vui lòng đăng nhập trang quản trị để liên hệ và tư vấn khách hàng.</p>
      </div>
    `;
    await emailQueueService
      .sendGeneric(ADMIN_EMAIL, `[${isBulk ? "Số lượng lớn" : "Đặt may"}] Yêu cầu mới từ ${data.name} - ${data.phone}`, html)
      .catch((err) => console.error("[Tailoring email]", err));

    res.status(201).json({ success: true, data: { id: request.id } });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
});

export { router as tailoringRoutes };
