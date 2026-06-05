"use client";

import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { giftCardApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/customer-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MyGiftCardsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("giftCard");
  const locale = useLocale();
  const [code, setCode] = useState("");

  const { data: cards = [], isLoading: loading } = useQuery({
    queryKey: ["account", "gift-cards"],
    queryFn: async () => {
      const { data } = await giftCardApi.myCards();
      return data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const redeemMutation = useMutation({
    mutationFn: (codeStr: string) => giftCardApi.redeem(codeStr),
    onSuccess: () => {
      toast.success(t("redeemSuccess"));
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["account", "gift-cards"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("redeemFailed"));
    }
  });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    redeemMutation.mutate(code);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("myTitle")}</h1>

      <form onSubmit={handleRedeem} className="bg-white rounded-lg border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("redeemLabel")}</label>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GC-XXXX-XXXX-XXXX" className="input flex-1 font-mono" />
          <button type="submit" disabled={redeemMutation.isPending} className="btn-primary px-4 cursor-pointer">
            {redeemMutation.isPending ? "..." : t("redeem")}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : cards.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{t("noCards")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c: any) => (
            <div key={c.id} className={`rounded-xl p-5 text-white ${c.isActive ? "bg-gradient-to-r from-primary-800 to-primary-900" : "bg-gray-400"}`}>
              <Gift className="w-6 h-6 mb-2" />
              <p className="font-mono text-sm">{c.code}</p>
              <p className="text-2xl font-bold mt-1">{formatPrice(c.balance)}</p>
              <p className="text-xs text-white/70 mt-1">
                {c.isActive ? t("expiry", { date: formatDate(c.expiresAt, locale) }) : t("inactive")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
