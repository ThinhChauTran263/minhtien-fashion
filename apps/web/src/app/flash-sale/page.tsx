"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { flashSaleApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toNumber } from "@/lib/customer-utils";
import { FlashSaleCountdown } from "@/components/product/flash-sale-countdown";

interface FlashItem {
  id: string;
  salePrice: number;
  quantity: number;
  sold: number;
  soldPercent: number;
  remaining: number;
  product: {
    id: string;
    slug: string;
    name: string;
    thumbnail: string;
    basePrice: string | number;
    salePrice?: string | number | null;
  };
}

interface FlashSale {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  items: FlashItem[];
}

export default function FlashSalePage() {
  const t = useTranslations("flashSale");
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flashSaleApi
      .getActive()
      .then(async ({ data }) => {
        if (data.data) {
          const detail = await flashSaleApi.getProducts(data.data.id);
          setFlashSale(detail.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!flashSale) {
    return (
      <div className="container-page py-16 text-center">
        <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">{t("noActive")}</h1>
        <p className="mt-2 text-gray-500">{t("checkLater")}</p>
        <Link href="/san-pham" className="mt-6 btn-primary inline-block cursor-pointer">
          {t("viewProducts")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 fill-white" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{flashSale.name}</h1>
              <p className="text-white/80 text-sm">{t("title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/90">{t("endsIn")}</span>
            <FlashSaleCountdown endsAt={flashSale.endsAt} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {flashSale.items.map((item) => {
          const soldOut = item.remaining <= 0;
          return (
            <Link
              key={item.id}
              href={`/san-pham/${item.product.slug}`}
              className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="relative aspect-[3/4] bg-primary-50">
                <Image
                  src={item.product.thumbnail}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-white" />
                  FLASH SALE
                </span>
                {soldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-3 py-1 rounded font-medium text-sm">
                      {t("soldOut")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-red-500 font-bold">{formatPrice(item.salePrice)}</span>
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(toNumber(item.product.basePrice))}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.soldPercent)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white drop-shadow">
                      {t("soldCount", { count: item.sold })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

