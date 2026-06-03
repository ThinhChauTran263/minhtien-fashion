import { stockService } from "../../src/services/stock.service";
import { AppError } from "../../src/middlewares/error.middleware";

function createMockTx() {
  return {
    productVariant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  } as any;
}

describe("stockService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("availableStock", () => {
    it("returns stock minus reserved and safety stock", () => {
      expect(stockService.availableStock(20, 5, 3)).toBe(12);
    });

    it("never returns a negative number", () => {
      expect(stockService.availableStock(5, 4, 10)).toBe(0);
    });

    it("treats zero reserved and zero safety stock as all stock available", () => {
      expect(stockService.availableStock(7, 0, 0)).toBe(7);
    });
  });

  describe("manualAdjust", () => {
    it("updates variant stock and writes an audit movement with positive delta", async () => {
      const tx = createMockTx();
      tx.productVariant.findUnique
        .mockResolvedValueOnce({ stock: 10, reserved: 2, safetyStock: 3 })
        .mockResolvedValueOnce({ stock: 15, reserved: 2 });
      tx.productVariant.update.mockResolvedValue({ id: "variant-1", stock: 15 });
      tx.stockMovement.create.mockResolvedValue({ id: "movement-1" });

      await stockService.manualAdjust(tx, "variant-1", 15, "admin-1", "restock count");

      expect(tx.productVariant.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: "variant-1" },
        select: { stock: true, reserved: true, safetyStock: true },
      });
      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: "variant-1" },
        data: { stock: 15 },
      });
      expect(tx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: "variant-1",
          type: "MANUAL_ADJUST",
          quantity: 5,
          stockAfter: 15,
          reservedAfter: 2,
          refType: "MANUAL",
          refId: "admin-1",
          note: "restock count",
        }),
      });
    });

    it("writes a negative delta when admin reduces stock", async () => {
      const tx = createMockTx();
      tx.productVariant.findUnique
        .mockResolvedValueOnce({ stock: 20, reserved: 4, safetyStock: 1 })
        .mockResolvedValueOnce({ stock: 12, reserved: 4 });
      tx.productVariant.update.mockResolvedValue({ id: "variant-1", stock: 12 });
      tx.stockMovement.create.mockResolvedValue({ id: "movement-1" });

      await stockService.manualAdjust(tx, "variant-1", 12, "admin-1");

      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: "variant-1" },
        data: { stock: 12 },
      });
      expect(tx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: -8,
          type: "MANUAL_ADJUST",
          refType: "MANUAL",
          refId: "admin-1",
        }),
      });
    });

    it("allows setting stock equal to reserved plus safety stock", async () => {
      const tx = createMockTx();
      tx.productVariant.findUnique
        .mockResolvedValueOnce({ stock: 20, reserved: 4, safetyStock: 6 })
        .mockResolvedValueOnce({ stock: 10, reserved: 4 });
      tx.productVariant.update.mockResolvedValue({ id: "variant-1", stock: 10 });
      tx.stockMovement.create.mockResolvedValue({ id: "movement-1" });

      await expect(stockService.manualAdjust(tx, "variant-1", 10, "admin-1")).resolves.toBeUndefined();

      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: "variant-1" },
        data: { stock: 10 },
      });
    });

    it("rejects adjustment when variant does not exist", async () => {
      const tx = createMockTx();
      tx.productVariant.findUnique.mockResolvedValue(null);

      await expect(stockService.manualAdjust(tx, "missing", 10, "admin-1")).rejects.toMatchObject({ statusCode: 404 });
      expect(tx.productVariant.update).not.toHaveBeenCalled();
      expect(tx.stockMovement.create).not.toHaveBeenCalled();
    });

    it("rejects stock lower than reserved plus safety stock", async () => {
      const tx = createMockTx();
      tx.productVariant.findUnique.mockResolvedValue({ stock: 20, reserved: 5, safetyStock: 3 });

      await expect(stockService.manualAdjust(tx, "variant-1", 7, "admin-1")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(tx.productVariant.update).not.toHaveBeenCalled();
      expect(tx.stockMovement.create).not.toHaveBeenCalled();
    });
  });
});

