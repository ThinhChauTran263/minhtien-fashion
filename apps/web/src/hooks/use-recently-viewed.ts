"use client";

import { useRecentlyViewedStore, type RecentItem } from "@/stores/recently-viewed-store";

export type RecentlyViewedItem = RecentItem;

export function useRecentlyViewed() {
  const items = useRecentlyViewedStore((s) => s.items);
  const add = useRecentlyViewedStore((s) => s.add);
  const clear = useRecentlyViewedStore((s) => s.clear);

  return { items, addItem: add, clear };
}

