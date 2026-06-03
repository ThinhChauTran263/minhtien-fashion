"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { bundleApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function ComboPage() {
  const t = useTranslations("combo");
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bundleApi
      .getAll()
      .then(({ data }) => setBundles(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-500 mb-8">{t("subtitle")}</p>

      {bundles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((b) => (
            <Link
              key={b.id}
              href={`/combo/${b.slug}`}
              className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="relative aspect-[4/3] bg-primary-50">
                {b.thumbnail ? (
                  <Image src={b.thumbnail} alt={b.name} fill className="object-cover" sizes="(min-width:1024px) 33vw, 100vw" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {b.pricing?.savedPercent > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{b.pricing.savedPercent}%
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 group-hover:text-accent transition-colors">{b.name}</h2>
                <p className="text-xs text-gray-500 mt-1">{t("items", { count: b.items?.length ?? 0 })}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-red-500 font-bold">{formatPrice(b.pricing?.finalPrice ?? 0)}</span>
                  <span className="text-xs text-gray-400 line-through">{formatPrice(b.pricing?.originalPrice ?? 0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

