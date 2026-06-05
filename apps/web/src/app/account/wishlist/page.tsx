"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import { userApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("account");

  const { data: items = [] } = useQuery({
    queryKey: ["account", "wishlist"],
    queryFn: async () => {
      const { data } = await userApi.getWishlist();
      return data.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userApi.removeFromWishlist(id),
    onSuccess: () => {
      toast.success(t("wishlistRemoved"));
      queryClient.invalidateQueries({ queryKey: ["account", "wishlist"] });
    }
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("wishlistTitle")}</h1>
      {items.length === 0 && (
        <div className="py-16 text-center">
          <svg className="mx-auto mb-6 h-32 w-32 text-primary-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p className="mb-6 text-sm text-primary-500">{t("wishlistEmpty")}</p>
          <Link href="/san-pham" className="btn-primary inline-flex items-center gap-2">
            Khám phá sản phẩm
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item: any) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product} />
            <button
              type="button"
              onClick={() => removeMutation.mutate(item.product.id)}
              disabled={removeMutation.isPending}
              className="mt-3 w-full rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
            >
              {t("wishlistRemove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
