"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productApi } from "@/lib/api";
import { ProductCard } from "./product-card";

export function RelatedProducts({ productId }: { productId: string }) {
  const t = useTranslations("productDetail");
  const { data } = useQuery({
    queryKey: ["related-products", productId],
    queryFn: () => productApi.getRelated(productId).then((res) => res.data.data),
  });

  const products = Array.isArray(data) ? data : [];
  if (products.length === 0) return null;

  return (
    <section className="mt-16" aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="mb-6 text-2xl font-bold text-gray-900">{t("relatedTitle")}</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

