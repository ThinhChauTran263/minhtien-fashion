"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { sizeGuideApi } from "@/lib/api";
import { SizeGuideTable } from "./size-guide-table";

export function SizeGuideModal({ open, onClose, categoryId }: { open: boolean; onClose: () => void; categoryId?: string | null }) {
  const t = useTranslations("sizeGuide");
  const tCommon = useTranslations("common");
  const { data } = useQuery({
    queryKey: ["size-guide", categoryId],
    queryFn: () => sizeGuideApi.get(categoryId).then((res) => res.data.data),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{t("title")}</h2>
            <p className="mt-1 text-sm text-primary-500">{t("modalSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-primary-50" aria-label={tCommon("close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <SizeGuideTable data={data?.data} />

        <div className="mt-5 flex flex-col gap-3 text-sm text-primary-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("betweenSizesTip")}</p>
          <Link href="/size-guide" className="text-accent hover:underline" onClick={onClose}>
            {t("viewDetails")}
          </Link>
        </div>
      </div>
    </div>
  );
}

