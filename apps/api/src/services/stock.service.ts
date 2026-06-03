import { Prisma, StockMovementType } from "@prisma/client";
import { AppError } from "../middlewares/error.middleware";

type Tx = Prisma.TransactionClient;

/**
 * Stock Service — write-path duy nhất cho tồn kho.
 *
 * Quy tắc:
 * - availableStock = stock - reserved - safetyStock
 * - Mọi thao tác dùng atomic conditional SQL (WHERE stock - reserved >= qty)
 * - Mọi thao tác ghi 1 dòng StockMovement (audit ledger bất biến)
 * - Caller chịu trách nhiệm row-lock (SELECT FOR UPDATE) + idempotency flag
 */
export const stockService = {
  /**
   * Reserve: giữ chỗ khi checkout online payment.
   * available giảm (reserved tăng), stock không đổi.
   */
  async reserve(
    tx: Tx,
    variantId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const result = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "reserved" = "reserved" + ${quantity}
      WHERE "id" = ${variantId}
        AND ("stock" - "reserved" - "safetyStock") >= ${quantity}
    `;
    if (result === 0) {
      throw new AppError("Không đủ hàng để giữ chỗ", 400);
    }
    await this.logMovement(tx, variantId, "RESERVE", -quantity, "ORDER", orderId);
  },

  /**
   * Commit: chốt bán sau khi thanh toán thành công.
   * reserved giảm, stock giảm (xuất kho thật).
   */
  async commitSale(
    tx: Tx,
    variantId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const result = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "stock" = "stock" - ${quantity},
          "reserved" = "reserved" - ${quantity}
      WHERE "id" = ${variantId}
        AND "reserved" >= ${quantity}
        AND "stock" >= ${quantity}
    `;
    if (result === 0) {
      throw new AppError("Lỗi commit sale: reserved/stock không đủ", 500);
    }
    await this.logMovement(tx, variantId, "COMMIT_SALE", -quantity, "ORDER", orderId);
  },

  /**
   * Release: nhả giữ chỗ khi hết hạn hoặc huỷ đơn chưa thanh toán.
   * reserved giảm, available tăng lại. stock không đổi.
   */
  async release(
    tx: Tx,
    variantId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const result = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "reserved" = "reserved" - ${quantity}
      WHERE "id" = ${variantId}
        AND "reserved" >= ${quantity}
    `;
    if (result === 0) {
      throw new AppError("Lỗi release: reserved không đủ", 500);
    }
    await this.logMovement(tx, variantId, "RELEASE", quantity, "ORDER", orderId);
  },

  /**
   * Deduct Direct: trừ kho trực tiếp (COD/BANK_TRANSFER — không qua reservation).
   * stock giảm hẳn.
   */
  async deductDirect(
    tx: Tx,
    variantId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const result = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "stock" = "stock" - ${quantity}
      WHERE "id" = ${variantId}
        AND ("stock" - "reserved" - "safetyStock") >= ${quantity}
    `;
    if (result === 0) {
      throw new AppError("Không đủ hàng trong kho", 400);
    }
    await this.logMovement(tx, variantId, "DEDUCT_DIRECT", -quantity, "ORDER", orderId);
  },

  /**
   * Restock Cancel: hoàn kho khi huỷ đơn đã trừ kho.
   * stock tăng lại.
   */
  async restockCancel(
    tx: Tx,
    variantId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "stock" = "stock" + ${quantity}
      WHERE "id" = ${variantId}
    `;
    await this.logMovement(tx, variantId, "RESTOCK_CANCEL", quantity, "ORDER", orderId);
  },

  /**
   * QC Grade A: hàng trả nguyên vẹn → nhập lại kho bán.
   */
  async restockReturnA(
    tx: Tx,
    variantId: string,
    quantity: number,
    returnId: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "stock" = "stock" + ${quantity}
      WHERE "id" = ${variantId}
    `;
    await this.logMovement(tx, variantId, "RESTOCK_RETURN_A", quantity, "RETURN", returnId);
  },

  /**
   * QC Grade B: hàng lỗi nhẹ → nhập kho outlet (bán giảm giá).
   */
  async returnBOutlet(
    tx: Tx,
    variantId: string,
    quantity: number,
    returnId: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET "outletStock" = "outletStock" + ${quantity}
      WHERE "id" = ${variantId}
    `;
    await this.logMovement(tx, variantId, "RETURN_B_OUTLET", quantity, "RETURN", returnId);
  },

  /**
   * QC Grade C: hàng hỏng nặng → write-off (chỉ ghi ledger, không nhập kho).
   */
  async writeOff(
    tx: Tx,
    variantId: string,
    quantity: number,
    returnId: string
  ): Promise<void> {
    await this.logMovement(tx, variantId, "WRITE_OFF", 0, "RETURN", returnId, `Tiêu huỷ ${quantity} sản phẩm`);
  },

  /**
   * Manual Adjust: admin chỉnh tay (nhập hàng, kiểm kê, sửa sai).
   */
  async manualAdjust(
    tx: Tx,
    variantId: string,
    newStock: number,
    adminId: string,
    note?: string
  ): Promise<void> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, reserved: true, safetyStock: true },
    });
    if (!variant) throw new AppError("Variant không tồn tại", 404);

    if (newStock < variant.reserved + variant.safetyStock) {
      throw new AppError(
        `Không thể đặt stock = ${newStock}. Tối thiểu phải >= ${variant.reserved + variant.safetyStock} (reserved: ${variant.reserved}, safetyStock: ${variant.safetyStock})`,
        400
      );
    }

    const delta = newStock - variant.stock;
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });
    await this.logMovement(
      tx, variantId, "MANUAL_ADJUST", delta, "MANUAL", adminId, note
    );
  },

  /**
   * Ghi 1 dòng StockMovement (bất biến).
   * Tự snapshot stock/reserved hiện tại sau thao tác.
   */
  async logMovement(
    tx: Tx,
    variantId: string,
    type: StockMovementType,
    quantity: number,
    refType?: string,
    refId?: string,
    note?: string,
    createdBy?: string
  ): Promise<void> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, reserved: true },
    });
    await tx.stockMovement.create({
      data: {
        variantId,
        type,
        quantity,
        stockAfter: variant?.stock ?? 0,
        reservedAfter: variant?.reserved ?? 0,
        refType,
        refId,
        note,
        createdBy,
      },
    });
  },

  async disposeDefectiveStock(tx: Tx, variantId: string, quantity: number, note: string) {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.defectiveStock < quantity) throw new AppError("Không đủ số lượng hàng lỗi", 400);

    await tx.productVariant.update({
      where: { id: variantId },
      data: { defectiveStock: { decrement: quantity } }
    });

    await this.logMovement(tx, variantId, "DISPOSE_DEFECTIVE", -quantity, "MANUAL", undefined, note);
  },

  /**
   * Tính available stock (dùng cho frontend/API).
   */
  availableStock(stock: number, reserved: number, safetyStock: number): number {
    return Math.max(0, stock - reserved - safetyStock);
  },
};
