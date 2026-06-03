"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productApi } from "@/lib/api";
import { ProductCard } from "./product-card";

export function CrossSellProducts({ productIds }: { productIds: string[] }) {
  const t = useTranslations("product");
  const firstProductId = productIds[0];
  const { data } = useQuery({
    queryKey: ["cross-sell", firstProductId],
    queryFn: () => productApi.getCrossSell(firstProductId, 4).then((res) => res.data.data),
    enabled: Boolean(firstProductId),
  });

  const products = Array.isArray(data) ? data : [];
  if (products.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="cross-sell-heading">
      <h2 id="cross-sell-heading" className="mb-6 text-xl font-bold">{t("crossSellTitle")}</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

