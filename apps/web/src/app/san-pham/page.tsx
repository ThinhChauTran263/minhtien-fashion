"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, ProductCardData } from "@/components/product/product-card";
import { SlidersHorizontal } from "lucide-react";
import { productApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const sizes = ["S", "M", "L", "XL", "XXL"];
const colors = [
  { key: "colorBlack", value: "Đen", hex: "#111827" },
  { key: "colorWhite", value: "Trắng", hex: "#FFFFFF" },
  { key: "colorNavy", value: "Xanh Navy", hex: "#1E3A8A" },
  { key: "colorGray", value: "Xám Melange", hex: "#9CA3AF" },
];

function ProductCardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="aspect-[3/4] rounded-card" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

export default function ProductListPage() {
  const t = useTranslations("productList");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productApi.getAll({
      sort,
      limit: 50,
      sizes: selectedSizes.length ? selectedSizes.join(",") : undefined,
      colors: selectedColors.length ? selectedColors.join(",") : undefined,
    })
      .then((res) => {
        setProducts(res.data?.data?.items ?? res.data?.items ?? []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [sort, selectedSizes, selectedColors]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("filters")}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-400">{t("sortLabel")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border-none focus:ring-0 cursor-pointer"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
            <option value="best_seller">{t("sortBestSeller")}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-60 shrink-0">
            <div className="mb-6">
              <h3 className="font-medium mb-3">{t("sizeHeading")}</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      selectedSizes.includes(size)
                        ? "bg-primary-800 text-white border-primary-800"
                        : "border-primary-200 hover:border-primary-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">{t("colorHeading")}</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => toggleColor(color.value)}
                    title={t(color.key)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColors.includes(color.value)
                        ? "border-accent"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSizes([]);
                setSelectedColors([]);
              }}
              className="text-sm text-accent hover:underline"
            >
              {t("clearFilters")}
            </button>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" role="status" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading products</span>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-primary-400 py-12">{t("noProducts")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
