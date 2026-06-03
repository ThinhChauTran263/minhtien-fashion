import { stockService } from "../stock.service";
import { AppError } from "../../middlewares/error.middleware";

describe("Stock Service", () => {
  describe("availableStock", () => {
    it("should calculate available stock correctly", () => {
      expect(stockService.availableStock(100, 20, 10)).toBe(70);
    });

    it("should not return negative available stock", () => {
      expect(stockService.availableStock(10, 20, 0)).toBe(0);
      expect(stockService.availableStock(50, 10, 50)).toBe(0);
    });
  });

  describe("manualAdjust", () => {
    let mockTx: any;

    beforeEach(() => {
      mockTx = {
        productVariant: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        stockMovement: {
          create: jest.fn(),
        },
      };
      jest.spyOn(stockService, "logMovement").mockImplementation(jest.fn());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should throw 404 if variant not found", async () => {
      mockTx.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        stockService.manualAdjust(mockTx, "v1", 100, "admin1")
      ).rejects.toThrow(AppError);
    });

    it("should throw error if newStock is less than reserved + safetyStock", async () => {
      mockTx.productVariant.findUnique.mockResolvedValue({
        stock: 50,
        reserved: 20,
        safetyStock: 10,
      });
      // minimum required is 30, trying to set 25
      await expect(
        stockService.manualAdjust(mockTx, "v1", 25, "admin1")
      ).rejects.toThrow(AppError);
    });

    it("should update stock and log movement correctly", async () => {
      mockTx.productVariant.findUnique.mockResolvedValue({
        stock: 50,
        reserved: 20,
        safetyStock: 10,
      });
      
      await stockService.manualAdjust(mockTx, "v1", 100, "admin1", "test");
      
      expect(mockTx.productVariant.update).toHaveBeenCalledWith({
        where: { id: "v1" },
        data: { stock: 100 },
      });
      expect(stockService.logMovement).toHaveBeenCalledWith(
        mockTx, "v1", "MANUAL_ADJUST", 50, "MANUAL", "admin1", "test"
      );
    });
  });
});
