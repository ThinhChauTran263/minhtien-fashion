"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { orderApi } from "@/lib/api";
import { formatDate, getOrderStatusLabel, orderStatusClass, toNumber } from "@/lib/customer-utils";
import { formatPrice } from "@/lib/utils";

export default function TrackOrderPage() {
  const t = useTranslations("orderTrack");
  const locale = useLocale() as "vi" | "en";
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setOrder(null);
    try {
      const { data } = await orderApi.track(code.trim());
      if (phone.trim() && data.data.shippingPhone !== phone.trim()) {
        toast.error(t("phoneMismatch"));
        return;
      }
      setOrder(data.data);
    } catch {
      toast.error(t("notFound"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
        <form onSubmit={handleSubmit} className="rounded-lg border border-primary-100 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input value={code} onChange={(event) => setCode(event.target.value)} required placeholder={t("codePlaceholder")} className="input" />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t("phonePlaceholder")} className="input" />
          </div>
          <button disabled={loading} className="btn-primary mt-4 w-full">{loading ? t("submitting") : t("submit")}</button>
        </form>

        {order && (
          <div className="mt-6 rounded-lg border border-primary-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="font-semibold">{order.code}</p><p className="text-sm text-primary-500">{formatDate(order.createdAt, locale)}</p></div>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${orderStatusClass(order.status)}`}>{getOrderStatusLabel(order.status, locale)}</span>
            </div>
            <p className="text-sm text-primary-500">{t("recipient", { name: order.shippingName, phone: order.shippingPhone })}</p>
            <p className="mt-2 font-semibold">{t("totalAmount", { amount: formatPrice(toNumber(order.total)) })}</p>
            <Link href={`/don-hang/${order.code}`} className="btn-outline mt-4 w-full py-2 text-sm">{t("viewDetails")}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
