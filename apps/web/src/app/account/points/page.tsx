"use client";

import { Gift, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { loyaltyApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/customer-utils";
import { useQuery } from "@tanstack/react-query";

interface PointHistory {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function LoyaltyPointsPage() {
  const t = useTranslations("loyalty");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["account", "points"],
    queryFn: async () => {
      const [balRes, histRes] = await Promise.all([
        loyaltyApi.getBalance(),
        loyaltyApi.getHistory(1, 50)
      ]);
      return {
        balance: balRes.data.data.points,
        discountValue: balRes.data.data.discountValue,
        history: histRes.data.data.items as PointHistory[],
      };
    },
    staleTime: 60 * 1000,
  });

  const balance = data?.balance ?? 0;
  const discountValue = data?.discountValue ?? 0;
  const history = data?.history ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const typeLabel = (type: string) => {
    if (type === "EARN_ORDER") return t("typeEarn");
    if (type === "REDEEM") return t("typeRedeem");
    if (type === "BONUS") return t("typeBonus");
    if (type === "EXPIRED") return t("typeExpired");
    return type;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 text-white/80">
          <Gift className="w-5 h-5" />
          <span className="text-sm">{t("balance")}</span>
        </div>
        <p className="mt-2 text-4xl font-bold">{balance.toLocaleString()}</p>
        <p className="mt-1 text-sm text-white/70">
          {t("discountValue", { amount: formatPrice(discountValue) })}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        {t("rules")}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("history")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">{t("noHistory")}</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.points >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    {item.points >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{typeLabel(item.type)}</p>
                    <p className="text-xs text-gray-400">
                      {item.description} • {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${item.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {item.points >= 0 ? "+" : ""}
                  {item.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
