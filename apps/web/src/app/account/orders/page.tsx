"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { orderApi } from "@/lib/api";
import { formatDate, orderStatusClassByStatus, getOrderStatusLabel, toNumber } from "@/lib/customer-utils";
import { formatPrice } from "@/lib/utils";

const filters = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"];

export default function AccountOrdersPage() {
  const t = useTranslations("account");
  const locale = useLocale() as "vi" | "en";
  const [status, setStatus] = useState("ALL");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["account", "orders"],
    queryFn: () => orderApi.getAll().then(({ data }) => data.data ?? []),
    staleTime: 60_000, // 1 min — instant on re-visit
  });

  const visibleOrders = useMemo(
    () => (status === "ALL" ? orders : orders.filter((order: any) => order.status === status)),
    [orders, status]
  );

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">{t("ordersHistory")}</h1>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input w-full md:w-56">
          {filters.map((item) => (
            <option key={item} value={item}>
              {item === "ALL" ? t("filterAll") : getOrderStatusLabel(item, locale)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-primary-100" />
            ))}
          </div>
        )}
        {!isLoading && visibleOrders.length === 0 && (
          <p className="text-sm text-primary-500">{t("ordersEmpty")}</p>
        )}
        {visibleOrders.map((order: any) => (
          <div key={order.id} className="rounded-lg border border-primary-100 bg-white p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="font-semibold">{order.code}</p>
                <p className="text-sm text-primary-500">
                  {formatDate(order.createdAt)} · {t("itemsCount", { count: order.items?.length ?? 0 })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${orderStatusClassByStatus(order.status)}`}>
                  {getOrderStatusLabel(order.status, locale)}
                </span>
                <span className="font-semibold">{formatPrice(toNumber(order.total))}</span>
                <Link href={`/don-hang/${order.code}`} className="btn-outline px-4 py-2 text-sm">
                  {t("viewDetails")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
