"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Gift, Heart, Home, KeyRound, LogOut, MapPin, Package, RotateCcw, User, Users, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { AccountBlocked } from "@/components/auth/account-blocked";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("account");
  const tNav = useTranslations("bottomNav");
  const pathname = usePathname();
  const router = useRouter();
  const { hydrate, isAuthenticated, isHydrated, blockedReason, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace("/dang-nhap");
  }, [isAuthenticated, isHydrated, router]);

  // Same pattern as admin layout: single conditional gate.
  // NEVER return null — either show loading or the full layout.
  if (!isHydrated || !isAuthenticated) {
    // Show blocked page if account was locked
    if (isHydrated && blockedReason) {
      return <AccountBlocked reason={blockedReason} />;
    }
    return (
      <div className="container-page py-16">
        <div className="animate-pulse text-sm text-primary-400">{t("checkingAuth")}</div>
      </div>
    );
  }

  const menu = [
    { href: "/account", label: t("menu.profile"), icon: User },
    { href: "/account/orders", label: t("menu.orders"), icon: Package },
    { href: "/account/returns", label: t("menu.returns"), icon: RotateCcw },
    { href: "/account/points", label: t("menu.points"), icon: Gift },
    { href: "/account/referrals", label: t("menu.referral"), icon: Users },
    { href: "/account/gift-cards", label: t("menu.giftCards"), icon: CreditCard },
    { href: "/account/addresses", label: t("menu.addresses"), icon: MapPin },
    { href: "/account/wishlist", label: t("menu.wishlist"), icon: Heart },
    { href: "/account/change-password", label: t("menu.changePassword"), icon: KeyRound },
  ];

  return (
    <div className="container-page py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="self-start rounded-lg border border-primary-100 bg-white p-3 lg:sticky lg:top-24">
          <Link href="/" className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-500 hover:bg-primary-50">
            <Home className="h-4 w-4" /> {tNav("home")}
          </Link>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-primary-800 text-white" : "text-primary-600 hover:bg-primary-50"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/dang-nhap");
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> {t("menu.logout")}
          </button>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}


