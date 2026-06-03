import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string;
  basePrice: number;
  salePrice?: number | null;
}

interface RecentlyViewedStore {
  items: RecentItem[];
  add: (item: RecentItem) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const filtered = get().items.filter((i) => i.id !== item.id);
        set({ items: [item, ...filtered].slice(0, 20) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "mtf-recently-viewed" }
  )
);

