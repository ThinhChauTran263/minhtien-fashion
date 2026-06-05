"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { adminApi } from "@/lib/api";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface NewsletterSubscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const t = useTranslations("admin.newsletter");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "newsletter", { page }],
    queryFn: async () => {
      const res = await adminApi.getNewsletter({ page, limit: 20 });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const columns = useMemo<Column<NewsletterSubscriber>[]>(
    () => [
      { key: "email", label: "Email" },
      {
        key: "isActive",
        label: t("status"),
        render: (item) => (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {item.isActive ? t("subscribed") : t("unsubscribed")}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: t("subscribedAt"),
        render: (item) => new Date(item.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US"),
      },
    ],
    [locale, t]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportNewsletter();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "newsletter-subscribers.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportError"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Mail className="h-6 w-6" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 cursor-pointer">
          <Download className="h-4 w-4" /> {exporting ? t("exporting") : t("exportCsv")}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-400">{t("loading")}</div>
      ) : (
        <DataTable columns={columns} data={items} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={t("empty")} />
      )}
    </div>
  );
}