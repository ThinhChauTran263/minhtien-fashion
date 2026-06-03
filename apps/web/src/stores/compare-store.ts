import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  material?: string | null;
  sizes: string[];
  colors: string[];
  stock?: number;
}

interface CompareStore {
  items: CompareItem[];
  add: (item: CompareItem) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const { items } = get();
        if (items.some((i) => i.id === item.id)) return true;
        if (items.length >= 4) return false;
        set({ items: [...items, item] });
        return true;
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "mtf-compare" }
  )
);

