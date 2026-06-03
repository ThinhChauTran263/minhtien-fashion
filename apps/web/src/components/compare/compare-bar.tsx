"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCompareStore } from "@/stores/compare-store";

export function CompareBar() {
  const t = useTranslations("compareBar");
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-100 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="container-page flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {items.map((item) => (
            <div key={item.id} className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-primary-100 bg-primary-50">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-0 top-0 rounded-bl bg-red-500 p-0.5 text-white"
                aria-label={t("removeItem")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <button type="button" onClick={clear} className="text-sm text-primary-500 hover:text-red-600">
            {t("clearAll")}
          </button>
          <Link
            href="/compare"
            className={`btn-primary px-4 py-2 text-sm ${items.length < 2 ? "pointer-events-none opacity-50" : ""}`}
          >
            {t("compare", { count: items.length })}
          </Link>
        </div>
      </div>
    </div>
  );
}

