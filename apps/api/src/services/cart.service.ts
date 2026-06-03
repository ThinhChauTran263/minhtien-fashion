import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";

export const cartService = {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    thumbnail: true,
                    basePrice: true,
                    salePrice: true,
                    isActive: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { variant: { include: { product: { select: { id: true, slug: true, name: true, thumbnail: true, basePrice: true, salePrice: true, isActive: true, deletedAt: true } } } } } } },
      });
    }

    // Filter out items whose product has been deactivated or soft-deleted Ã¢â‚¬â€
    // they shouldn't be checkoutable and shouldn't show up in the UI.
    cart.items = cart.items.filter(
      (item) => item.variant.product.isActive && item.variant.product.deletedAt === null
    );

    return cart;
  },

  async addItem(userId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          select: { isActive: true, deletedAt: true },
        },
      },
    });
    if (!variant || !variant.isActive) {
      throw new AppError("SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);
    }
    if (!variant.product.isActive || variant.product.deletedAt !== null) {
      throw new AppError("SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜ÃƒÂ£ ngÃ¡Â»Â«ng kinh doanh", 400);
    }
    const availableStock = variant.stock - variant.reserved - variant.safetyStock;
    if (availableStock < quantity) {
      throw new AppError("KhÃƒÂ´ng Ã„â€˜Ã¡Â»Â§ hÃƒÂ ng trong kho", 400);
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > availableStock) {
        throw new AppError("VÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng tÃ¡Â»â€œn kho", 400);
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, variantId, quantity },
      });
    }

    return this.getCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError("GiÃ¡Â»Â hÃƒÂ ng trÃ¡Â»â€˜ng", 404);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) throw new AppError("Item khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i", 404);

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      if (quantity > item.variant.stock - item.variant.reserved - item.variant.safetyStock) {
        throw new AppError("VÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng tÃ¡Â»â€œn kho", 400);
      }
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError("GiÃ¡Â»Â hÃƒÂ ng trÃ¡Â»â€˜ng", 404);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, OR: [{ id: itemId }, { variantId: itemId }] },
    });

    return this.getCart(userId);
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { items: [] };
  },
};



