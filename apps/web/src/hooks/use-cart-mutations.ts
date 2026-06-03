import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cartApi } from "@/lib/api";
import { LocalCartItem, useCartStore } from "@/stores/cart-store";
import { toNumber } from "@/lib/customer-utils";

type ServerCartItem = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    size: string;
    color: string;
    stock: number;
    reserved?: number | null;
    safetyStock?: number | null;
    price?: string | number | null;
    product: {
      id: string;
      slug: string;
      name: string;
      thumbnail: string;
      basePrice: string | number;
      salePrice?: string | number | null;
    };
  };
};

type ServerCart = {
  items?: ServerCartItem[];
};

type ApiCartResponse = {
  data?: {
    data?: ServerCart;
  };
};

type SnapshotContext = {
  previousItems: LocalCartItem[];
};

const cartQueryKey = ["cart"];

function mapServerCart(cart?: ServerCart): LocalCartItem[] | null {
  if (!cart?.items) return null;

  return cart.items.map((item) => {
    const variant = item.variant;
    const product = variant.product;
    const availableStock = Math.max(
      0,
      variant.stock - (variant.reserved ?? 0) - (variant.safetyStock ?? 0)
    );

    return {
      cartItemId: item.id,
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      thumbnail: product.thumbnail,
      size: variant.size,
      color: variant.color,
      price: toNumber(variant.price ?? product.salePrice ?? product.basePrice),
      quantity: item.quantity,
      maxStock: availableStock,
    };
  });
}

function syncCartFromResponse(response: ApiCartResponse) {
  const serverItems = mapServerCart(response.data?.data);
  if (serverItems) {
    useCartStore.getState().setItems(serverItems);
  }
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  const addCartItem = useMutation<ApiCartResponse, Error, LocalCartItem, SnapshotContext>({
    mutationFn: (item) => cartApi.addItem(item.variantId, item.quantity),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousItems = useCartStore.getState().items;

      useCartStore.getState().addItem(item);
      queryClient.setQueryData(cartQueryKey, { items: useCartStore.getState().items });

      return { previousItems };
    },
    onError: (_error, _item, context) => {
      if (context?.previousItems) {
        useCartStore.getState().setItems(context.previousItems);
        queryClient.setQueryData(cartQueryKey, { items: context.previousItems });
      }
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Đã hoàn tác thay đổi.");
    },
    onSuccess: syncCartFromResponse,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });

  const removeCartItem = useMutation<ApiCartResponse, Error, LocalCartItem, SnapshotContext>({
    mutationFn: (item) => cartApi.removeItem(item.cartItemId ?? item.variantId),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousItems = useCartStore.getState().items;

      useCartStore.getState().removeItem(item.variantId);
      queryClient.setQueryData(cartQueryKey, { items: useCartStore.getState().items });

      return { previousItems };
    },
    onError: (_error, _item, context) => {
      if (context?.previousItems) {
        useCartStore.getState().setItems(context.previousItems);
        queryClient.setQueryData(cartQueryKey, { items: context.previousItems });
      }
      toast.error("Không thể xóa sản phẩm khỏi giỏ hàng. Đã hoàn tác thay đổi.");
    },
    onSuccess: syncCartFromResponse,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });

  return { addCartItem, removeCartItem };
}

