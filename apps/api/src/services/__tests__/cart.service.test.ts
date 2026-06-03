import { cartService } from "../cart.service";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

jest.mock("../../config/database", () => ({
  prisma: {
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Cart Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addItem", () => {
    it("should throw 404 if variant does not exist", async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(cartService.addItem("user1", "var1", 1)).rejects.toThrow(AppError);
    });

    it("should throw error if stock is insufficient", async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: "var1",
        isActive: true,
        stock: 10,
        reserved: 5,
        safetyStock: 2, // available = 3
        product: { isActive: true, deletedAt: null },
      });

      await expect(cartService.addItem("user1", "var1", 4)).rejects.toThrow("KhÃ´ng Ä‘á»§ hÃ ng trong kho");
    });

    it("should add item correctly when stock is sufficient", async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: "var1",
        isActive: true,
        stock: 10,
        reserved: 0,
        safetyStock: 0,
        product: { isActive: true, deletedAt: null },
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: "cart1" });
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cartItem.create as jest.Mock).mockResolvedValue({});
      jest.spyOn(cartService, "getCart").mockResolvedValue({} as any);

      await cartService.addItem("user1", "var1", 2);

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: "cart1", variantId: "var1", quantity: 2 },
      });
    });
  });
});
