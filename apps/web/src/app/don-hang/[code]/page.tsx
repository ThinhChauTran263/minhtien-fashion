"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { orderApi } from "@/lib/api";
import { formatDate, getOrderStatusLabel, orderStatusClass, toNumber } from "@/lib/customer-utils";
import { formatPrice } from "@/lib/utils";
import { ReturnForm } from "@/components/return/return-form";

const timeline = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"];

export default function OrderDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const t = useTranslations("orderDetail");
  const locale = useLocale() as "vi" | "en";
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    orderApi.getByCode(params.code)
      .then(({ data }) => setOrder(data.data))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401) {
          router.replace(`/login?next=/orders/${params.code}`);
          return;
        }
        if (status === 403) {
          toast.error("You do not have permission to view this order");
          router.replace("/account/orders");
          return;
        }
        toast.error(t("notFound"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  const cancelOrder = async () => {
    try {
      await orderApi.cancel(params.code);
      toast.success(t("cancelled"));
      loadOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("cancelError"));
    }
  };

  if (loading) return <div className="container-page py-16 text-sm text-primary-500">{t("loading")}</div>;
  if (!order) return <div className="container-page py-16 text-sm text-primary-500">{t("notFound")}</div>;

  const currentIndex = timeline.indexOf(order.status);
  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
  const canReturn = order.status === "DELIVERED" && (Date.now() - deliveredDate.getTime()) / 86400000 <= 7;

  return (
    <div className="container-page py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("title", { code: order.code })}</h1>
          <p className="mt-1 text-sm text-primary-500">{t("createdAt", { date: formatDate(order.createdAt, locale) })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${orderStatusClass(order.status)}`}>
            {getOrderStatusLabel(order.status, locale)}
          </span>
          {order.status === "PENDING" && <button onClick={cancelOrder} className="btn-outline px-4 py-2 text-sm text-red-600">{t("cancel")}</button>}
          {canReturn && <button onClick={() => setShowReturnForm((open) => !open)} className="btn-outline px-4 py-2 text-sm">{t("returnExchange")}</button>}
        </div>
      </div>

      {showReturnForm && (
        <div className="mb-8">
          <ReturnForm order={order} onCreated={() => setShowReturnForm(false)} />
        </div>
      )}

      {/* Order Status Stepper */}
      <div className="mb-8 rounded-xl border border-primary-100 bg-white p-6">
        <div className="relative flex items-start justify-between">
          {/* Progress bar connecting dots */}
          <div className="absolute left-0 right-0 top-4 h-[2px] bg-primary-100" aria-hidden="true">
            <div
              className="h-full bg-primary-800 transition-all duration-500"
              style={{ width: currentIndex >= 0 ? `${(currentIndex / (timeline.length - 1)) * 100}%` : "0%" }}
            />
          </div>

          {timeline.map((status, index) => {
            const isCompleted = index < currentIndex || (index === currentIndex && currentIndex === timeline.length - 1);
            const isCurrent = index === currentIndex && currentIndex < timeline.length - 1;
            const isCancelled = order.status === "CANCELLED";

            return (
              <div key={status} className="relative flex flex-col items-center" style={{ width: `${100 / timeline.length}%` }}>
                {/* Step circle */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                    isCancelled
                      ? "border-red-200 bg-red-50 text-red-400"
                      : isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isCurrent
                          ? "border-primary-800 bg-primary-800 text-white ring-4 ring-primary-100"
                          : "border-primary-200 bg-white text-primary-300"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Label */}
                <p className={`mt-2 text-center text-[11px] leading-tight sm:text-xs ${
                  isCurrent ? "font-semibold text-primary-900" : isCompleted ? "font-medium text-emerald-700" : "text-primary-400"
                }`}>
                  {getOrderStatusLabel(status, locale)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-primary-100 bg-white p-4">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded bg-primary-50">
                <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="mt-1 text-sm text-primary-500">{item.variantName} x{item.quantity}</p>
                <p className="mt-2 text-sm font-semibold">{formatPrice(toNumber(item.price))}</p>
              </div>
              <p className="font-semibold">{formatPrice(toNumber(item.subtotal))}</p>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-primary-100 bg-white p-5">
            <h2 className="mb-3 font-semibold">{t("shippingInfo")}</h2>
            <p className="text-sm font-medium">{order.shippingName}</p>
            <p className="text-sm text-primary-500">{order.shippingPhone}</p>
            <p className="mt-2 text-sm text-primary-500">{order.shippingAddress}</p>
          </section>
          <section className="rounded-lg border border-primary-100 bg-white p-5">
            <h2 className="mb-3 font-semibold">{t("payment")}</h2>
            <p className="text-sm text-primary-500">{t("paymentMethod", { method: order.paymentMethod })}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>{t("subtotal")}</span><span>{formatPrice(toNumber(order.subtotal))}</span></div>
              <div className="flex justify-between"><span>{t("shipping")}</span><span>{formatPrice(toNumber(order.shippingFee))}</span></div>
              <div className="flex justify-between"><span>{t("discount")}</span><span>-{formatPrice(toNumber(order.discount))}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>{t("total")}</span><span>{formatPrice(toNumber(order.total))}</span></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
