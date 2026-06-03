"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";

export default function ComparePage() {
  const t = useTranslations("comparePage");
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold">{t("emptyTitle")}</h1>
        <p className="mb-6 text-sm text-primary-500">{t("emptyText")}</p>
        <Link href="/san-pham" className="btn-primary">{t("viewProducts")}</Link>
      </div>
    );
  }

  const minPrice = Math.min(...items.map((item) => item.price));

  const rows = [
    { label: t("rowPrice"), render: (item: typeof items[number]) => <span className={item.price === minPrice ? "font-bold text-green-600" : ""}>{formatPrice(item.price)}</span> },
    { label: t("rowCategory"), render: (item: typeof items[number]) => item.category || "-" },
    { label: t("rowMaterial"), render: (item: typeof items[number]) => item.material || "-" },
    { label: t("rowSizes"), render: (item: typeof items[number]) => item.sizes.length ? item.sizes.join(", ") : "-" },
    { label: t("rowColors"), render: (item: typeof items[number]) => item.colors.length ? item.colors.join(", ") : "-" },
    { label: t("rowStock"), render: (item: typeof items[number]) => item.stock ?? "-" },
  ];

  return (
    <div className="container-page py-8 pb-32">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-primary-500">{t("subtitle")}</p>
        </div>
        <button type="button" onClick={clear} className="btn-outline px-4 py-2 text-sm">{t("clearAll")}</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-primary-100 bg-white">
        <table className="min-w-[720px] w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-primary-100 align-top">
              <th className="w-36 bg-primary-50 p-4 text-left font-semibold">{t("rowProduct")}</th>
              {items.map((item) => (
                <td key={item.id} className="min-w-48 p-4">
                  <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded bg-primary-50">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="180px" />
                    <button type="button" onClick={() => remove(item.id)} className="absolute right-2 top-2 rounded-full bg-white p-1 shadow" aria-label={t("remove")}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-medium text-primary-800">{item.name}</p>
                  <Link href={`/san-pham/${item.slug}`} className="mt-3 inline-block text-sm text-accent hover:underline">
                    {t("viewDetails")}
                  </Link>
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-primary-100">
                <th className="bg-primary-50 p-4 text-left font-semibold">{row.label}</th>
                {items.map((item) => <td key={item.id} className="p-4">{row.render(item)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
