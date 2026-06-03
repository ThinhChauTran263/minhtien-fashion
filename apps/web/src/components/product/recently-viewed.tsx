"use client";

import { useTranslations } from "next-intl";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "./product-card";

interface RecentlyViewedProps {
  /** ID sáº£n pháº©m hiá»‡n táº¡i Ä‘á»ƒ loáº¡i khá»i danh sÃ¡ch */
  excludeId?: string;
  title?: string;
}

export function RecentlyViewed({ excludeId, title }: RecentlyViewedProps) {
  const t = useTranslations("product");
  const { items } = useRecentlyViewed();
  const filtered = items.filter((i) => i.id !== excludeId);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-16" aria-labelledby="recently-viewed-heading">
      <h2 id="recently-viewed-heading" className="text-2xl font-bold text-gray-900 mb-6">
        {title ?? t("recentlyViewedDefault")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filtered.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

