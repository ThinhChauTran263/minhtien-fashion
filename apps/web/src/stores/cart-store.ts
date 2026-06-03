import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocalCartItem {
  cartItemId?: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: LocalCartItem[];
  setItems: (items: LocalCartItem[]) => void;
  addItem: (item: LocalCartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const CART_STORAGE_KEY = "mtf-cart";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      setItems: (items) => set({ items }),

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.variantId === item.variantId);
        if (existing) {
          const newQty = Math.min(existing.quantity + item.quantity, item.maxStock);
          set({
            items: items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.variantId !== variantId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                : i
            ),
          });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      clear: () => set({ items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: CART_STORAGE_KEY }
  )
);

export function clearPersistedCart() {
  useCartStore.getState().clear();
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable; in-memory cart is already cleared.
  }
}

