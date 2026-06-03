"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { productApi } from "@/lib/api";
import { ProductCard } from "@/components/product/product-card";

const sizes = ["S", "M", "L", "XL", "XXL"];

function SearchFallback() {
  const t = useTranslations("search");
  return <div className="container-page py-8 text-sm text-primary-500">{t("searching")}</div>;
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsContent() {
  const t = useTranslations("search");
  const tList = useTranslations("productList");
  const tCommon = useTranslations("common");
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setLoading(true);
    productApi
      .getAll({ q: query, sort })
      .then(({ data }) => setProducts(data.data.items ?? []))
      .finally(() => setLoading(false));
  }, [query, sort]);

  const visibleProducts = useMemo(() => {
    if (!selectedSizes.length) return products;
    return products.filter((product) => product.variants?.some((variant: any) => selectedSizes.includes(variant.size) && variant.stock > 0));
  }, [products, selectedSizes]);

  return (
    <div className="container-page py-8">
      <h1 className="mb-2 text-2xl font-bold">{t("title", { q: query || tCommon("all") })}</h1>

      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" /> {tList("filters")}
        </button>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="text-sm">
          <option value="newest">{tList("sortNewest")}</option>
          <option value="price_asc">{tList("sortPriceAsc")}</option>
          <option value="price_desc">{tList("sortPriceDesc")}</option>
          <option value="best_seller">{tList("sortBestSeller")}</option>
        </select>
      </div>

      <div className="flex gap-8">
        {showFilters && (
          <aside className="w-56 shrink-0">
            <h3 className="mb-3 font-medium">{tList("sizeHeading")}</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setSelectedSizes((prev) =>
                      prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
                    )
                  }
                  className={`rounded border px-3 py-1.5 text-sm ${
                    selectedSizes.includes(size)
                      ? "border-primary-800 bg-primary-800 text-white"
                      : "border-primary-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </aside>
        )}
        <div className="flex-1">
          {loading && <p className="text-sm text-primary-500">{t("searching")}</p>}
          {!loading && visibleProducts.length === 0 && (
            <p className="text-sm text-primary-500">{t("noResults")}</p>
          )}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
