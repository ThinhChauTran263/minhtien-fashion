"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";

interface StickyAddCartProps {
  price: number;
  onAdd: () => void;
  disabled?: boolean;
}

export function StickyAddCart({ price, onAdd, disabled }: StickyAddCartProps) {
  const t = useTranslations("productDetail");
  const [visible, setVisible] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      // Hiá»‡n khi scroll xuá»‘ng vÃ  Ä‘Ã£ qua 300px, áº©n khi scroll lÃªn
      if (y > 300 && y > lastY) setVisible(true);
      else if (y < lastY - 50) setVisible(false);
      setLastY(y);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  return (
    <div
      className={`md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 safe-bottom transition-transform duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs text-gray-500">{t("priceLabel")}</p>
          <p className="text-base font-bold text-red-500">{formatPrice(price)}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={disabled}
          className="ml-auto btn-primary !py-3 cursor-pointer flex-1 max-w-[60%] disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4 mr-2 inline" />
          {t("addToCartShort")}
        </button>
      </div>
    </div>
  );
}

