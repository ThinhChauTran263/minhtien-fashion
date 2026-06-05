"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { productApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  thumbnail: string;
  basePrice: string | number;
  salePrice?: string | number | null;
}

const navItems = [
  { href: "/ao-co-co", key: "collared" },
  { href: "/ao-co-tron", key: "roundneck" },
  { href: "/san-pham", key: "allProducts" },
  { href: "/dat-may", key: "tailoring" },
  { href: "/size-guide", key: "sizeGuide" },
  { href: "/blog", key: "blog" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const cartCount = useCartStore((s) => s.getCount());
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await productApi.search(trimmed);
        setResults(data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const goToSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-primary-100/80 bg-white/90 backdrop-blur-xl">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link href="/" className="group flex flex-col leading-none" aria-label="Minh Tien Fashion home">
            <span className="font-display text-xl font-bold text-primary-950 md:text-2xl">MINH TIEN</span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-400 sm:block">Menswear</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="luxury-link">
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" className="rounded-full p-2 transition-colors hover:bg-primary-100" aria-label={t("search")} onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </button>

            <LanguageSwitcher />

            <Link href="/cart" className="relative rounded-full p-2 transition-colors hover:bg-primary-100" aria-label={t("cart")}>
              <ShoppingBag className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-950 px-1 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {mounted && isAuthenticated ? (
              <Link href="/account" className="rounded-full p-2 transition-colors hover:bg-primary-100" title={user?.name} aria-label={t("account")}>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
            ) : (
              <Link href="/login" className="hidden rounded-button border border-primary-200 px-4 py-2 text-sm font-medium transition-colors hover:border-primary-900 hover:bg-primary-900 hover:text-white sm:inline-flex">
                {t("login")}
              </Link>
            )}

            <button type="button" className="rounded-full p-2 transition-colors hover:bg-primary-100 md:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="animate-slide-up border-t border-primary-100 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md px-2 py-3 text-sm font-medium hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>
                  {t(item.key)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[120] animate-fade-in bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto mt-20 w-full max-w-2xl animate-scale-in overflow-hidden rounded-card bg-white shadow-elevated">
            <div className="flex items-center gap-3 border-b border-primary-100 p-4">
              <Search className="h-5 w-5 text-primary-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") goToSearch();
                  if (event.key === "Escape") closeSearch();
                }}
                placeholder={t("searchPlaceholder")}
                className="flex-1 border-none bg-transparent text-base outline-none focus:ring-0"
              />
              <button type="button" onClick={closeSearch} className="rounded-full p-2 transition-colors hover:bg-primary-100" aria-label={t("closeSearch")}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[440px] overflow-y-auto p-3">
              {query.trim().length < 2 && <p className="px-2 py-6 text-sm text-primary-400">{t("searchHint")}</p>}
              {query.trim().length >= 2 && searching && <p className="px-2 py-6 text-sm text-primary-400">{t("searching")}</p>}
              {query.trim().length >= 2 && !searching && results.length === 0 && <p className="px-2 py-6 text-sm text-primary-400">{t("noResults")}</p>}
              <div className="space-y-2">
                {results.map((product) => (
                  <button key={product.id} onClick={() => { closeSearch(); router.push(`/san-pham/${product.slug}`); }} className="flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors hover:bg-primary-50">
                    <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-primary-50">
                      <Image src={product.thumbnail} alt={product.name} fill className="object-cover" sizes="48px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className="text-sm text-primary-500">{formatPrice(Number(product.salePrice ?? product.basePrice))}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-primary-100 p-3">
              <button type="button" onClick={goToSearch} disabled={!query.trim()} className="btn-primary w-full py-2.5">
                {t("viewAllResults")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
