jest.mock("../../src/config/database", () => ({
  prisma: {
    productVariant: { findUnique: jest.fn() },
    cart: { findUnique: jest.fn(), create: jest.fn() },
    cartItem: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

import { prisma } from "../../src/config/database";
import { cartService } from "../../src/services/cart.service";

const mockedPrisma = prisma as unknown as {
  productVariant: { findUnique: jest.Mock };
  cart: { findUnique: jest.Mock; create: jest.Mock };
  cartItem: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
};

function activeVariant(overrides: Partial<{ stock: number; reserved: number; safetyStock: number }> = {}) {
  return {
    id: "variant-1",
    isActive: true,
    stock: overrides.stock ?? 10,
    reserved: overrides.reserved ?? 3,
    safetyStock: overrides.safetyStock ?? 2,
    product: { isActive: true, deletedAt: null },
  };
}

describe("cartService.addItem availableStock guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(cartService, "getCart").mockResolvedValue({ id: "cart-1", userId: "user-1", items: [] } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects adding a new item when requested quantity exceeds stock - reserved - safetyStock", async () => {
    mockedPrisma.productVariant.findUnique.mockResolvedValue(activeVariant({ stock: 10, reserved: 3, safetyStock: 2 }));

    await expect(cartService.addItem("user-1", "variant-1", 6)).rejects.toMatchObject({ statusCode: 400 });

    expect(mockedPrisma.cart.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.cartItem.create).not.toHaveBeenCalled();
    expect(mockedPrisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("allows adding a new item when requested quantity equals available stock", async () => {
    mockedPrisma.productVariant.findUnique.mockResolvedValue(activeVariant({ stock: 10, reserved: 3, safetyStock: 2 }));
    mockedPrisma.cart.findUnique.mockResolvedValue({ id: "cart-1", userId: "user-1" });
    mockedPrisma.cartItem.findUnique.mockResolvedValue(null);
    mockedPrisma.cartItem.create.mockResolvedValue({ id: "item-1" });

    await expect(cartService.addItem("user-1", "variant-1", 5)).resolves.toEqual({ id: "cart-1", userId: "user-1", items: [] });

    expect(mockedPrisma.cartItem.create).toHaveBeenCalledWith({
      data: { cartId: "cart-1", variantId: "variant-1", quantity: 5 },
    });
  });

  it("rejects incrementing an existing item beyond available stock, not raw stock", async () => {
    mockedPrisma.productVariant.findUnique.mockResolvedValue(activeVariant({ stock: 10, reserved: 3, safetyStock: 2 }));
    mockedPrisma.cart.findUnique.mockResolvedValue({ id: "cart-1", userId: "user-1" });
    mockedPrisma.cartItem.findUnique.mockResolvedValue({ id: "item-1", cartId: "cart-1", variantId: "variant-1", quantity: 4 });

    await expect(cartService.addItem("user-1", "variant-1", 2)).rejects.toMatchObject({ statusCode: 400 });

    expect(mockedPrisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("allows incrementing an existing item up to available stock", async () => {
    mockedPrisma.productVariant.findUnique.mockResolvedValue(activeVariant({ stock: 10, reserved: 3, safetyStock: 2 }));
    mockedPrisma.cart.findUnique.mockResolvedValue({ id: "cart-1", userId: "user-1" });
    mockedPrisma.cartItem.findUnique.mockResolvedValue({ id: "item-1", cartId: "cart-1", variantId: "variant-1", quantity: 4 });
    mockedPrisma.cartItem.update.mockResolvedValue({ id: "item-1", quantity: 5 });

    await expect(cartService.addItem("user-1", "variant-1", 1)).resolves.toEqual({ id: "cart-1", userId: "user-1", items: [] });

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { quantity: 5 },
    });
  });
});
