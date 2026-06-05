"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Heart, Loader2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toNumber } from "@/lib/customer-utils";
import { formatPrice } from "@/lib/utils";
import { useCartMutations } from "@/hooks/use-cart-mutations";
import { useAuthStore } from "@/stores/auth-store";
import { userApi } from "@/lib/api";
import dynamic from "next/dynamic";

const SizeGuideModal = dynamic(() => import("./size-guide-modal").then(mod => mod.SizeGuideModal), { 
  ssr: false, 
});
import { ZoomableImage } from "./zoomable-image";

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  price?: string | number | null;
}

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  categoryId?: string | null;
  description: string;
  material?: string | null;
  basePrice: string | number;
  salePrice?: string | number | null;
  thumbnail: string;
  images: string[];
  variants: ProductVariant[];
}

export function ProductDetailClient({ product }: { product: ProductDetail }) {
  const t = useTranslations("productDetail");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addCartItem } = useCartMutations();
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [selectedColor, setSelectedColor] = useState<string | null>(firstAvailable?.color ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color))), [product]);

  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return product.variants.filter((v) => v.color === selectedColor);
  }, [product, selectedColor]);

  const selectedVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const price = toNumber(selectedVariant?.price ?? product.salePrice ?? product.basePrice);

  const { data: wishlistItems = [], isFetching: isWishlistLoading } = useQuery({
    queryKey: ["account", "wishlist"],
    queryFn: async () => {
      const { data } = await userApi.getWishlist();
      return data.data ?? [];
    },
    enabled: isHydrated && isAuthenticated,
    staleTime: 60 * 1000,
  });

  const isWishlisted = wishlistItems.some((item: any) => item.product?.id === product.id || item.productId === product.id);

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWishlisted) {
        await userApi.removeFromWishlist(product.id);
        return false;
      }
      await userApi.addToWishlist(product.id);
      return true;
    },
    onSuccess: (addedToWishlist) => {
      queryClient.invalidateQueries({ queryKey: ["account", "wishlist"] });
      toast.success(addedToWishlist ? t("favoriteAdded") : t("favoriteRemoved"));
    },
    onError: () => {
      toast.error(t("favoriteError"));
    },
  });

  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock === 0 || isAdding) return;

    if (!isHydrated) {
      await hydrate();
    }

    if (!useAuthStore.getState().isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${product.slug}`)}`);
      return;
    }

    setIsAdding(true);
    setLiveMessage(`${product.name} is being added to cart`);
    addCartItem.mutate({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      thumbnail: product.thumbnail,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price,
      quantity: 1,
      maxStock: selectedVariant.stock,
    });
    setAdded(true);
    setLiveMessage(`${product.name} added to cart`);
    toast.success(t("added"), {
      description: `${selectedVariant.color} / ${selectedVariant.size}`,
      action: {
        label: t("viewCart"),
        onClick: () => router.push("/cart"),
      },
    });
    window.setTimeout(() => setIsAdding(false), 350);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const handleToggleWishlist = async () => {
    if (!isHydrated) {
      await hydrate();
    }

    if (!useAuthStore.getState().isAuthenticated) {
      toast.info(t("favoriteLoginRequired"));
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${product.slug}`)}`);
      return;
    }

    wishlistMutation.mutate();
  };

  const images = product.images.length ? product.images : [product.thumbnail];

  return (
    <>
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div className="grid grid-cols-1 gap-4">
        {images.map((img, index) => (
          <ZoomableImage
            key={img}
            src={img}
            alt={`${product.name} ${index + 1}`}
            priority={index === 0}
          />
        ))}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="mb-3 text-3xl font-bold">{product.name}</h1>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-semibold text-red-500">{formatPrice(price)}</span>
          {product.salePrice && (
            <span className="text-lg text-primary-400 line-through">{formatPrice(toNumber(product.basePrice))}</span>
          )}
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">{t("colorLabel")}: {selectedColor}</p>
          <div className="flex gap-2">
            {colors.map((color) => {
              const hex = product.variants.find((v) => v.color === color)?.colorHex;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    const firstSize = product.variants.find((v) => v.color === color && v.stock > 0);
                    setSelectedSize(firstSize?.size ?? null);
                  }}
                  className={`h-10 w-10 cursor-pointer rounded-full border-2 transition-colors ${selectedColor === color ? "border-accent" : "border-primary-200 hover:border-primary-400"}`}
                  style={{ backgroundColor: hex }}
                  title={color}
                  aria-label={color}
                />
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t("sizeLabel")}</p>
            <button type="button" onClick={() => setShowSizeGuide(true)} className="text-sm text-accent underline">
              {t("sizeGuideLink")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((variant) => (
              <button
                key={variant.id}
                type="button"
                disabled={variant.stock === 0}
                onClick={() => setSelectedSize(variant.size)}
                className={`cursor-pointer rounded border px-4 py-2 text-sm transition-colors ${selectedSize === variant.size ? "border-primary-800 bg-primary-800 text-white" : "border-primary-200 hover:border-primary-400"} ${variant.stock === 0 ? "cursor-not-allowed opacity-40 line-through" : ""}`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>

        <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} categoryId={product.categoryId} />

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <button
            ref={addToCartRef}
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0 || isAdding}
            aria-busy={isAdding}
            className={`btn-primary w-full cursor-pointer transition-transform ${isAdding ? "scale-[0.99] opacity-80" : ""}`}
          >
            {added ? (
              <>
                <Check className="mr-2 h-5 w-5" /> {t("added")}
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-5 w-5" /> {t("addToCart")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading || wishlistMutation.isPending}
            aria-pressed={isWishlisted}
            aria-busy={isWishlistLoading || wishlistMutation.isPending}
            className={`inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-button border px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
              isWishlisted
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-primary-200 bg-white text-primary-800 hover:border-primary-400 hover:bg-primary-50"
            }`}
          >
            {isWishlistLoading || wishlistMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
            )}
            {isWishlisted ? t("favorited") : t("favorite")}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">{liveMessage}</p>

        <div className="mt-6 border-t pt-6">
          <h2 className="mb-2 font-medium">{t("descTitle")}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-primary-500">{product.description}</p>
          {product.material && (
            <p className="mt-3 text-sm text-primary-500"><span className="font-medium">{t("materialLabel")}:</span> {product.material}</p>
          )}
        </div>
      </div>
    </div>

    {/* Sticky Add-to-Cart Mobile */}
    {showStickyBar && (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary-200 bg-white p-3 shadow-lg md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-sm font-semibold text-primary-900">{formatPrice(price)}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading || wishlistMutation.isPending}
            aria-label={isWishlisted ? t("favorited") : t("favorite")}
            aria-pressed={isWishlisted}
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-wait disabled:opacity-70 ${
              isWishlisted
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-primary-200 bg-white text-primary-800 hover:bg-primary-50"
            }`}
          >
            {isWishlistLoading || wishlistMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
            )}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0 || isAdding}
            aria-busy={isAdding}
            className={`btn-primary shrink-0 px-5 py-2.5 text-sm transition-transform ${isAdding ? "scale-[0.98] opacity-80" : ""}`}
          >
            {added ? <Check className="mr-1.5 h-4 w-4" /> : <ShoppingBag className="mr-1.5 h-4 w-4" />} {added ? t("added") : t("addToCart")}
          </button>
        </div>
      </div>
    )}
  </>
  );
}


