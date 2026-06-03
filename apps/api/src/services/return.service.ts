import { Prisma, ReturnStatus, ReturnType } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { toVND } from "../utils/money";
import { emailService } from "./email.service";
import { emailQueueService } from "./email-queue.service";
import { stockService } from "./stock.service";

interface CreateReturnInput {
  orderId: string;
  type: ReturnType;
  reason: string;
  description?: string;
  images?: string[];
  items: Array<{ orderItemId: string; quantity: number; newSize?: string; newColor?: string }>;
}

// QC grading cho từng item trả về
export interface QcGradeItem {
  orderItemId: string;
  variantId: string;
  quantity: number;
  grade: "A" | "B" | "C";
  note?: string;
}

function generateReturnCode() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RT-${year}-${suffix}`;
}

function returnEmailHtml(title: string, message: string, code: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>${title}</h2><p>${message}</p><p><strong>Ma yeu cau:</strong> ${code}</p></div>`;
}

export const returnService = {
  async createReturnRequest(userId: string, data: CreateReturnInput) {
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId, status: "DELIVERED" },
      include: { items: true, user: { select: { email: true, name: true } } },
    });
    if (!order) throw new AppError("Don hang khong hop le hoac chua giao", 400);

    const deliveredAt = order.deliveredAt ?? order.updatedAt;
    const daysSince = (Date.now() - deliveredAt.getTime()) / 86400000;
    if (daysSince > 7) throw new AppError("Da qua 7 ngay, khong the doi tra", 400);

    const itemById = new Map(order.items.map((item) => [item.id, item]));
    for (const item of data.items) {
      const orderItem = itemById.get(item.orderItemId);
      if (!orderItem || item.quantity < 1 || item.quantity > orderItem.quantity) {
        throw new AppError("San pham doi tra khong hop le", 400);
      }
    }

    const refundAmount = data.items.reduce((sum, item) => {
      const orderItem = itemById.get(item.orderItemId)! as any;
      const itemGross = toVND(orderItem.price) * item.quantity;
      const discountForReturned = Math.round(
        (toVND(orderItem.discountAllocated ?? 0) * item.quantity) / orderItem.quantity
      );
      return sum + Math.max(0, itemGross - discountForReturned);
    }, 0);

    const request = await prisma.returnRequest.create({
      data: {
        code: generateReturnCode(),
        orderId: order.id,
        userId,
        type: data.type,
        reason: data.reason,
        description: data.description,
        images: data.images ?? [],
        items: data.items as Prisma.InputJsonValue,
        refundAmount: data.type === "RETURN" ? refundAmount : undefined,
      },
      include: { order: true, user: { select: { id: true, email: true, name: true } } },
    });

    if (order.user?.email) {
      await emailQueueService.sendGeneric(
        order.user.email,
        `Minh Tien Fashion da nhan yeu cau doi tra ${request.code}`,
        returnEmailHtml("Da nhan yeu cau doi tra", "Chung toi se kiem tra va phan hoi trong thoi gian som nhat.", request.code)
      );
    }

    return request;
  },

  async getMyReturns(userId: string) {
    return prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { code: true, total: true, status: true } } },
    });
  },

  async getReturnByCode(code: string, userId?: string, isAdmin = false) {
    const request = await prisma.returnRequest.findUnique({
      where: { code },
      include: {
        order: { include: { items: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!request) throw new AppError("Yeu cau doi tra khong ton tai", 404);
    if (!isAdmin && request.userId !== userId) throw new AppError("Khong co quyen xem yeu cau nay", 403);
    return request;
  },

  async getAllReturns(status?: ReturnStatus) {
    return prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, code: true, total: true, items: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  },

  async updateReturnStatus(id: string, status: ReturnStatus, adminNote?: string) {
    const request = await prisma.returnRequest.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
    if (!request) throw new AppError("Khong tim thay", 404);

    // Block backwards status updates if money/stock already processed
    if (request.refundProcessed && status !== "REFUNDED" && status !== "COMPLETED") {
      throw new AppError("Không thể lùi trạng thái vì đơn đã được hoàn tiền và xử lý kho.", 400);
    }

    const updatedRequest = await prisma.returnRequest.update({
      where: { id },
      data: { status, adminNote },
      include: { user: { select: { email: true } } },
    });

    if (status === "APPROVED" || status === "REFUNDED" || status === "COMPLETED") {
      const message = status === "APPROVED"
        ? "Yeu cau da duoc duyet. Vui long gui san pham con tem mac, chua giat va hoa don ve Minh Tien Fashion."
        : status === "REFUNDED"
          ? "Yeu cau hoan tien dang duoc xu ly."
          : "Yeu cau doi tra da hoan tat.";
      await emailQueueService.sendGeneric(
        request.user.email,
        `Cap nhat yeu cau doi tra ${request.code}`,
        returnEmailHtml("Cap nhat yeu cau doi tra", message, request.code)
      );
    }

    return request;
  },

  /**
   * QC kiểm định hàng trả về — IDEMPOTENT qua flag stockProcessed.
   * Luồng: RECEIVED → INSPECTING → (gọi hàm này) → REFUNDED/COMPLETED
   *
   * Grade A: nhập lại kho bán (stock tăng)
   * Grade B: nhập kho outlet (outletStock tăng)
   * Grade C: tiêu huỷ (chỉ ghi ledger, không nhập kho)
   */
  async processQcInspection(id: string, grades: QcGradeItem[]) {
    return prisma.$transaction(async (tx) => {
      // Lock row để idempotent
      const [request] = await tx.$queryRaw<
        Array<{ id: string; stockProcessed: boolean; status: string; orderId: string }>
      >`SELECT id, "stockProcessed", status, "orderId" FROM "ReturnRequest" WHERE id = ${id} FOR UPDATE`;

      if (!request) throw new AppError("Yeu cau doi tra khong ton tai", 404);

      // Idempotent: đã xử lý rồi thì skip
      if (request.stockProcessed) {
        return tx.returnRequest.findUnique({ where: { id } });
      }

      if (request.status !== "RECEIVED" && request.status !== "INSPECTING") {
        throw new AppError("Chi xu ly QC khi hang da nhan ve kho (RECEIVED/INSPECTING)", 400);
      }

      // Xử lý từng item theo grade
      for (const item of grades) {
        switch (item.grade) {
          case "A":
            await stockService.restockReturnA(tx, item.variantId, item.quantity, id);
            break;
          case "B":
            await stockService.returnBOutlet(tx, item.variantId, item.quantity, id);
            break;
          case "C":
            await stockService.writeOff(tx, item.variantId, item.quantity, id);
            break;
        }
      }

      // Cập nhật return request
      return tx.returnRequest.update({
        where: { id },
        data: {
          status: "INSPECTING",
          stockProcessed: true,
          qcResults: grades as unknown as Prisma.InputJsonValue,
        },
        include: { user: { select: { email: true } } },
      });
    });
  },

  /**
   * Hoàn tiền — CHỈ cho phép sau khi QC đã xong (stockProcessed = true).
   * IDEMPOTENT qua flag refundProcessed.
   */
  async processRefund(id: string, qcGrades?: QcGradeItem[]) {
    return prisma.$transaction(async (tx) => {
      const [request] = await tx.$queryRaw<
        Array<{ id: string; stockProcessed: boolean; refundProcessed: boolean; orderId: string; status: string }>
      >`SELECT id, "stockProcessed", "refundProcessed", "orderId", status FROM "ReturnRequest" WHERE id = ${id} FOR UPDATE`;

      if (!request) throw new AppError("Yeu cau doi tra khong ton tai", 404);

      // Idempotent
      if (request.refundProcessed) {
        if (request.status !== "REFUNDED" && request.status !== "COMPLETED") {
          return tx.returnRequest.update({
            where: { id },
            data: { status: "REFUNDED" },
          });
        }
        return tx.returnRequest.findUnique({ where: { id } });
      }

      if (!request.stockProcessed) {
        const fullRequest = await tx.returnRequest.findUnique({
          where: { id },
          include: { order: { include: { items: true } } },
        });
        if (!fullRequest) throw new AppError("Yeu cau doi tra khong ton tai", 404);

        const returnItems = (fullRequest.items as any) || [];
        const orderItemMap = new Map(fullRequest.order.items.map((item) => [item.id, item]));

        const grades: QcGradeItem[] = [];
        for (const item of returnItems) {
          let orderItem = orderItemMap.get(item.orderItemId);
          if (!orderItem && item.orderItemProductSlug) {
            orderItem = Array.from(orderItemMap.values()).find((o: any) => o.productSlug === item.orderItemProductSlug);
            if (orderItem) item.orderItemId = orderItem.id;
          }
          if (!orderItem) throw new AppError(`San pham don hang ${item.orderItemId || item.orderItemProductSlug} khong ton tai`, 400);

          // Lấy grade được truyền lên, hoặc tự động xác định dựa trên lý do
          let grade: "A" | "B" | "C" = "A";
          let note = "Kiem dinh tu dong";

          const provided = qcGrades?.find((g) => g.orderItemId === item.orderItemId);
          if (provided) {
            grade = provided.grade;
            note = provided.note || "Kiem dinh tu giao dien admin";
          } else {
            // Nếu không truyền lên, tự động check lý do đổi trả
            const reasonLower = (fullRequest.reason || "").toLowerCase();
            const descLower = (fullRequest.description || "").toLowerCase();
            if (
              reasonLower.includes("lỗi") || reasonLower.includes("hỏng") || reasonLower.includes("rách") || reasonLower.includes("bẩn") ||
              descLower.includes("lỗi") || descLower.includes("hỏng") || descLower.includes("rách") || descLower.includes("bẩn")
            ) {
              grade = "C";
              note = "Tu dong kiem dinh Grade C do san pham loi/hong";
            } else {
              note = "Tu dong kiem dinh Grade A do hang binh thuong";
            }
          }

          // Gọi stock service xử lý tồn kho tương ứng với grade
          if (grade === "A") {
            await stockService.restockReturnA(tx, orderItem.variantId, item.quantity, id);
          } else if (grade === "B") {
            await stockService.returnBOutlet(tx, orderItem.variantId, item.quantity, id);
          } else if (grade === "C") {
            await stockService.writeOff(tx, orderItem.variantId, item.quantity, id);
          }

          grades.push({
            orderItemId: item.orderItemId,
            variantId: orderItem.variantId,
            quantity: item.quantity,
            grade,
            note,
          });
        }

        // Cập nhật trạng thái stockProcessed và qcResults
        await tx.returnRequest.update({
          where: { id },
          data: {
            stockProcessed: true,
            qcResults: grades as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await tx.order.update({
        where: { id: request.orderId },
        data: { paymentStatus: "REFUNDED", status: "RETURNED" },
      });

      return tx.returnRequest.update({
        where: { id },
        data: {
          status: "REFUNDED",
          refundProcessed: true,
        },
      });
    });
  },
};
