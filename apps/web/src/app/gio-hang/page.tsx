"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { CrossSellProducts } from "@/components/product/cross-sell-products";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartMutations } from "@/hooks/use-cart-mutations";

function CartPageSkeleton() {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading cart">
      <Skeleton className="mb-8 h-8 w-56" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-lg border border-primary-100 bg-white p-4">
              <Skeleton className="h-32 w-24 shrink-0 rounded" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-primary-50 p-6">
          <Skeleton className="mb-5 h-6 w-32" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-6 h-4 w-5/6" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading cart</span>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("cart");
  const tHome = useTranslations("home");
  const { items, updateQuantity, getTotal } = useCartStore();
  const { removeCartItem } = useCartMutations();
  const [mounted, setMounted] = useState(false);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const total = getTotal();
  const shippingFee = total >= 500000 ? 0 : 30000;
  const finalTotal = total + shippingFee;

  const markOptimisticChange = (variantId: string, message: string) => {
    setPendingVariantId(variantId);
    setLiveMessage(message);
    window.setTimeout(() => setPendingVariantId(null), 300);
  };

  if (!mounted) return <CartPageSkeleton />;

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <svg className="mx-auto mb-6 h-32 w-32 text-primary-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <h1 className="text-2xl font-bold mb-4">{t("empty")}</h1>
        <p className="text-primary-500 mb-6">{t("emptyText")}</p>
        <Link href="/san-pham" className="btn-primary inline-flex items-center gap-2">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold mb-8">{t("titleWithCount", { count: items.length })}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <div
              key={item.variantId}
              className={`flex gap-4 bg-white border border-primary-100 rounded-lg p-4 transition-all ${pendingVariantId === item.variantId ? "scale-[0.99] bg-primary-50 shadow-sm" : ""}`}
            >
              <div className="relative w-24 h-32 bg-primary-50 rounded shrink-0 overflow-hidden">
                <Image src={item.thumbnail} alt={item.productName} fill className="object-cover" sizes="96px" priority={index === 0} />
              </div>

              <div className="flex-1">
                <Link href={`/san-pham/${item.productSlug}`} className="font-medium hover:text-accent">
                  {item.productName}
                </Link>
                <p className="text-sm text-primary-400 mt-1">
                  {item.color} / {item.size}
                </p>
                <p className="text-sm font-semibold mt-2">{formatPrice(item.price)}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-primary-200 rounded">
                    <button
                      type="button"
                      aria-label={t("decrease")}
                      onClick={() => {
                        updateQuantity(item.variantId, item.quantity - 1);
                        markOptimisticChange(item.variantId, `${item.productName} quantity updated`);
                      }}
                      className="p-1.5 hover:bg-primary-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={t("increase")}
                      onClick={() => {
                        updateQuantity(item.variantId, item.quantity + 1);
                        markOptimisticChange(item.variantId, `${item.productName} quantity updated`);
                      }}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 hover:bg-primary-50 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => {
                      markOptimisticChange(item.variantId, `${item.productName} removed from cart`);
                      window.setTimeout(() => removeCartItem.mutate(item), 120);
                    }}
                    className="text-primary-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-primary-50 rounded-lg p-6">
            <h2 className="font-semibold mb-4">{t("summary")}</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-500">{t("subtotal")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-500">{t("shipping")}</span>
                <span>{shippingFee === 0 ? t("shippingFree") : formatPrice(shippingFee)}</span>
              </div>
              {total < 500000 && (
                <p className="text-xs text-accent">
                  {t("freeshipHint", { amount: formatPrice(500000 - total) })}
                </p>
              )}
            </div>

            <div className="border-t border-primary-200 my-4 pt-4 flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>

            <Link href="/thanh-toan" className="btn-primary w-full">
              {t("checkout")}
            </Link>
          </div>
        </aside>
      </div>

      <CrossSellProducts productIds={items.map((item) => item.productId)} />
      <RecentlyViewed title={tHome("recentlyViewed")} />
      <p className="sr-only" aria-live="polite">{liveMessage}</p>
    </div>
  );
}


