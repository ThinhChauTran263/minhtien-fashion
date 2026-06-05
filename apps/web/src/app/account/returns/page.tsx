"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { returnApi } from "@/lib/api";
import { formatDate } from "@/lib/customer-utils";
import { useQuery } from "@tanstack/react-query";

const STATUS_KEYS = ["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "COMPLETED"] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

const STATUS_TR_KEY: Record<StatusKey, string> = {
  PENDING: "statusPending",
  APPROVED: "statusApproved",
  REJECTED: "statusRejected",
  RECEIVED: "statusReceived",
  REFUNDED: "statusRefunded",
  COMPLETED: "statusCompleted",
};

export default function MyReturnsPage() {
  const t = useTranslations("returns");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["account", "returns"],
    queryFn: async () => {
      const res = await returnApi.getMine();
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const getStatusLabel = (status: string) => {
    const key = STATUS_TR_KEY[status as StatusKey];
    return key ? t(key as any) : status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-primary-500">{t("pageSubtitle")}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-primary-500">{tCommon("loading")}</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-primary-100 bg-white p-6 text-sm text-primary-500">
          {t("empty")} <Link href="/account/orders" className="text-accent hover:underline">{t("viewOrders")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => {
            const stepKeys: StatusKey[] = ["PENDING", "APPROVED", "RECEIVED", item.type === "RETURN" ? "REFUNDED" : "COMPLETED"];
            const currentIdx = STATUS_KEYS.indexOf(item.status as StatusKey);
            return (
              <div key={item.id} className="rounded-lg border border-primary-100 bg-white p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold">{item.code}</p>
                    <p className="text-sm text-primary-500">
                      {t("orderRef", { code: item.order?.code })} - {item.type === "RETURN" ? t("typeReturn") : t("typeExchange")}
                    </p>
                    <p className="mt-1 text-xs text-primary-400">{formatDate(item.createdAt, locale)}</p>
                  </div>
                  <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">{getStatusLabel(item.status)}</span>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-2">
                  {stepKeys.map((status) => (
                    <div key={status} className="col-span-3 text-xs md:col-span-1">
                      <div className={`mb-1 h-2 rounded-full ${currentIdx >= STATUS_KEYS.indexOf(status) ? "bg-primary-800" : "bg-primary-100"}`} />
                      {getStatusLabel(status)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

