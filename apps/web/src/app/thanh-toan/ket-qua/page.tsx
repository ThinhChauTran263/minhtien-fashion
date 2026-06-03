"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { orderApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface OrderInfo {
  code: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
}

function PaymentResultContent() {
  const t = useTranslations("checkoutResult");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const code = searchParams.get("code");
  const method = searchParams.get("method");
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  let finalStatus: "success" | "failed" | "pending" = "pending";
  if (status === "success") finalStatus = "success";
  else if (status === "failed") finalStatus = "failed";
  else if (vnpResponseCode === "00") finalStatus = "success";
  else if (vnpResponseCode) finalStatus = "failed";

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    orderApi
      .track(code)
      .then((res) => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        {finalStatus === "success" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("successTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("successText")}</p>
          </>
        ) : finalStatus === "failed" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("failedTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("failedText")}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("pendingTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("pendingText")}</p>
          </>
        )}

        {order && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("orderCode")}</span>
              <span className="font-medium font-mono">{order.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("amount")}</span>
              <span className="font-medium">{formatPrice(Number(order.total))}</span>
            </div>
            {method && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t("method")}</span>
                <span className="font-medium uppercase">{method}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {code && (
            <Link href={`/don-hang/${code}`} className="btn-primary flex-1 cursor-pointer">
              {t("viewOrder")}
            </Link>
          )}
          <Link href="/" className="btn-outline flex-1 cursor-pointer">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
