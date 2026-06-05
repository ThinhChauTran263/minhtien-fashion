"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Boxes,
  Image,
  LayoutDashboard,
  Mail,
  Package,
  RotateCcw,
  Factory,
  Ruler,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
  FileText,
  Layers,
  CreditCard,
  Zap,
  Scissors,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

const menuItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "products", href: "/admin/products", icon: Package },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
  { key: "inventory", href: "/admin/inventory", icon: Boxes, badge: true },
  { key: "reports", href: "/admin/reports", icon: BarChart3 },
  { key: "flashSale", href: "/admin/flash-sale", icon: Zap },
  { key: "bundles", href: "/admin/bundles", icon: Layers },
  { key: "blog", href: "/admin/blog", icon: FileText },
  { key: "giftCards", href: "/admin/gift-cards", icon: CreditCard },
  { key: "vouchers", href: "/admin/vouchers", icon: Ticket },
  { key: "customers", href: "/admin/customers", icon: Users },
  { key: "banners", href: "/admin/banners", icon: Image },
  { key: "newsletter", href: "/admin/newsletter", icon: Mail },
  { key: "tailoring", href: "/admin/tailoring", icon: Scissors },
  { key: "manufacturing", href: "/admin/manufacturing", icon: Factory },
  { key: "sizeGuide", href: "/admin/size-guide", icon: Ruler },
  { key: "returns", href: "/admin/returns", icon: RotateCcw },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    adminApi
      .getInventoryCounts()
      .then((res) => setLowStockCount((res.data.data?.lowStock ?? 0) + (res.data.data?.outOfStock ?? 0)))
      .catch(() => undefined);
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <Link href="/admin" className="text-lg font-bold text-primary-800">
            {t("brand")}
          </Link>
          <button onClick={onClose} className="cursor-pointer rounded p-1 hover:bg-gray-100 lg:hidden" aria-label={t("closeMenu")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const showBadge = "badge" in item && item.badge && lowStockCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary-800 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{t(`nav.${item.key}`)}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {lowStockCount > 99 ? "99+" : lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
