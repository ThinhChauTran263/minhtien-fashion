"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { flashSaleApi } from "@/lib/api";
import { FlashSaleCountdown } from "./flash-sale-countdown";

interface ActiveFlashSale {
  id: string;
  name: string;
  endsAt: string;
  items: unknown[];
}

export function FlashSaleBanner() {
  const t = useTranslations("flashSale");
  const [flashSale, setFlashSale] = useState<ActiveFlashSale | null>(null);

  useEffect(() => {
    flashSaleApi
      .getActive()
      .then(({ data }) => {
        if (data.data) setFlashSale(data.data);
      })
      .catch(() => {});
  }, []);

  if (!flashSale) return null;

  return (
    <Link
      href="/flash-sale"
      className="block bg-gradient-to-r from-red-500 to-orange-500 cursor-pointer"
    >
      <div className="container-page py-3">
        <div className="flex items-center justify-center gap-3 text-white flex-wrap">
          <span className="flex items-center gap-2 font-bold">
            <Zap className="w-5 h-5 fill-white" />
            {flashSale.name}
          </span>
          <span className="text-white/80 text-sm hidden sm:inline">|</span>
          <span className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline">{t("endsIn")}</span>
            <FlashSaleCountdown endsAt={flashSale.endsAt} className="text-xs" />
          </span>
          <span className="underline text-sm font-medium">{t("buyNow")}</span>
        </div>
      </div>
    </Link>
  );
}

