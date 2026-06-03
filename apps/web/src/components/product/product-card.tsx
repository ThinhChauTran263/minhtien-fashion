"use client";

import Link from "next/link";
import Image from "next/image";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  thumbnail?: string;
  image?: string;
  basePrice?: number | string;
  salePrice?: number | string | null;
  price?: number | string;
  category?: { name: string } | string;
  material?: string | null;
  variants?: Array<{ size?: string; color?: string; stock?: number }>;
  sizes?: string[];
  colors?: string[];
}

interface Props {
  product: ProductCardData;
  compact?: boolean;
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function ProductCard({ product, compact = false }: Props) {
  const t = useTranslations("product");
  const addCompare = useCompareStore((s) => s.add);
  const removeCompare = useCompareStore((s) => s.remove);
  const inCompare = useCompareStore((s) => s.has(product.id));
  const basePrice = Number(product.basePrice ?? product.price ?? 0);
  const salePrice = product.salePrice === null || product.salePrice === undefined ? null : Number(product.salePrice);
  const hasSale = Boolean(salePrice && salePrice < basePrice);
  const displayPrice = Number(salePrice ?? basePrice);
  const thumbnail = product.thumbnail ?? product.image ?? "/images/polo-classic-1.svg";
  const blurUrl = thumbnail.includes("res.cloudinary.com")
    ? thumbnail.replace("/upload/", "/upload/e_blur:1000,w_10,q_10/")
    : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEzIiBmaWxsPSIjZjVmNWY0Ii8+PC9zdmc+";
  const categoryName = typeof product.category === "string" ? product.category : product.category?.name ?? t("categoryFallback");
  const sizes = product.sizes ?? unique(product.variants?.map((v) => v.size) ?? []);
  const colors = product.colors ?? unique(product.variants?.map((v) => v.color) ?? []);
  const stock = product.variants?.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0);
  const discount = hasSale ? Math.round(((basePrice - salePrice!) / basePrice) * 100) : 0;

  const toggleCompare = () => {
    if (inCompare) {
      removeCompare(product.id);
      return;
    }
    const added = addCompare({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: displayPrice,
      image: thumbnail,
      category: categoryName,
      material: product.material,
      sizes,
      colors,
      stock,
    });
    if (!added) toast.error(t("compareLimit"));
  };

  return (
    <div className="group relative rounded-card bg-white p-2 shadow-card transition-all duration-300 ease-luxury hover:-translate-y-1.5 hover:shadow-card-hover">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-card bg-primary-50">
          <Image
            src={thumbnail}
            alt={product.name}
            fill
            placeholder="blur"
            blurDataURL={blurUrl}
            className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Gradient + reveal CTA on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-luxury group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 ease-luxury group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center justify-center rounded-button bg-white/95 py-2 text-xs font-semibold uppercase tracking-wide text-primary-950 shadow-card backdrop-blur">
              {t("viewProduct")}
            </span>
          </div>

          {hasSale && (
            <div className="absolute right-3 top-3 rounded-badge bg-primary-950 px-2.5 py-1 text-xs font-medium text-white shadow-card">
              -{discount}%
            </div>
          )}
        </div>

        <div className="px-1 pb-2">
          {!compact && categoryName && (
            <p className="mb-1 text-caption uppercase text-primary-400">{categoryName}</p>
          )}
          <h3 className="line-clamp-2 text-sm font-medium text-primary-900 transition-colors group-hover:text-accent-500">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            {hasSale ? (
              <>
                <span className="text-sm font-semibold text-primary-950">{formatPrice(displayPrice)}</span>
                <span className="text-xs text-primary-400 line-through">{formatPrice(basePrice)}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-primary-950">{formatPrice(displayPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={toggleCompare}
        className={`absolute left-4 top-4 rounded-full border p-2.5 shadow-card transition-all duration-200 ease-luxury hover:-translate-y-0.5 ${
          inCompare ? "border-primary-900 bg-primary-900 text-white" : "border-white/80 bg-white/90 text-primary-700 backdrop-blur hover:bg-primary-50"
        }`}
        aria-label={inCompare ? t("removeCompare") : t("compare")}
        title={inCompare ? t("removeCompare") : t("compare")}
      >
        <Scale className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

