"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Home, Grid, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", key: "home", icon: Home, match: (p: string) => p === "/" },
  { href: "/products", key: "categories", icon: Grid, match: (p: string) => p.startsWith("/products") || p.startsWith("/ao-co") || p.startsWith("/san-pham") },
  { href: "/cart", key: "cart", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") || p.startsWith("/gio-hang") },
  { href: "/account", key: "account", icon: User, match: (p: string) => p.startsWith("/account") || p.startsWith("/login") || p.startsWith("/dang-nhap") },
] as const;

export function BottomNav() {
  const t = useTranslations("bottomNav");
  const pathname = usePathname() || "/";
  const itemCount = useCartStore((s) => s.items?.reduce((n, i) => n + i.quantity, 0) ?? 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-primary-100 bg-white/95 backdrop-blur-lg safe-bottom touch-manipulation"
    >
      <ul className="grid grid-cols-4 h-[4.25rem]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          const isCart = tab.href === "/cart";
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full min-w-[44px] min-h-[44px] text-[11px] font-medium cursor-pointer transition-colors duration-150",
                  active
                    ? "text-primary-950"
                    : "text-primary-400 active:text-primary-700"
                )}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full bg-primary-900" />
                )}
                <span className="relative mt-1">
                  <Icon
                    className={cn(
                      "transition-all duration-150",
                      active ? "w-[22px] h-[22px] stroke-[2.2]" : "w-5 h-5 stroke-[1.8]"
                    )}
                  />
                  {isCart && mounted && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary-950 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </span>
                <span className={cn("mt-1", active ? "font-semibold" : "")}>
                  {t(tab.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
