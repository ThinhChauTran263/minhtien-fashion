"use client";

import { useEffect } from "react";
import { useRecentlyViewed, type RecentlyViewedItem } from "@/hooks/use-recently-viewed";

/**
 * Component khÃ´ng render gÃ¬, chá»‰ lÆ°u sáº£n pháº©m hiá»‡n táº¡i vÃ o recently viewed.
 */
export function TrackRecentlyViewed({ product }: { product: RecentlyViewedItem }) {
  const { addItem } = useRecentlyViewed();

  useEffect(() => {
    addItem(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}

