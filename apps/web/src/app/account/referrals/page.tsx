"use client";

import { useState } from "react";
import { Copy, Check, Gift, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { referralApi } from "@/lib/api";
import { formatDate } from "@/lib/customer-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ReferralPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["account", "referrals"],
    queryFn: async () => {
      const [codeRes, statsRes] = await Promise.all([
        referralApi.myCode(),
        referralApi.stats()
      ]);
      return {
        code: codeRes.data.data.code,
        stats: statsRes.data.data,
      };
    },
    staleTime: 60 * 1000,
  });

  const code = data?.code ?? "";
  const stats = data?.stats ?? null;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = `${siteUrl}?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Đã copy link giới thiệu");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyMutation = useMutation({
    mutationFn: (codeStr: string) => referralApi.apply(codeStr),
    onSuccess: () => {
      toast.success("Áp dụng mã thành công! Bạn nhận được voucher 30K.");
      setApplyCode("");
      queryClient.invalidateQueries({ queryKey: ["account", "referrals"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Mã không hợp lệ");
    }
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(applyCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Giới thiệu bạn bè</h1>

      <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-6 text-white">
        <Gift className="w-8 h-8 mb-2" />
        <h2 className="text-xl font-bold">Mời bạn - Nhận 50K</h2>
        <p className="text-white/80 text-sm mt-1">
          Bạn bè mua đơn đầu tiên từ 200K, cả 2 cùng nhận voucher!
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link giới thiệu của bạn</label>
        <div className="flex gap-2">
          <input readOnly value={shareLink} className="input flex-1 font-mono text-sm" />
          <button onClick={copy} className="btn-primary px-4 cursor-pointer">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-primary-800 mb-1" />
          <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
          <p className="text-xs text-gray-500">Đã giới thiệu</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats?.rewarded ?? 0}</p>
          <p className="text-xs text-gray-500">Đã nhận thưởng</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats?.pending ?? 0}</p>
          <p className="text-xs text-gray-500">Đang chờ</p>
        </div>
      </div>

      {/* Apply code */}
      {!stats?.referredBy && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Có mã giới thiệu?</h3>
          <form onSubmit={handleApply} className="flex gap-2">
            <input value={applyCode} onChange={(e) => setApplyCode(e.target.value)} placeholder="Nhập mã bạn bè" className="input flex-1" />
            <button type="submit" disabled={applyMutation.isPending} className="btn-primary px-4 cursor-pointer">Áp dụng</button>
          </form>
        </div>
      )}

      {/* History */}
      {stats?.items?.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Lịch sử giới thiệu</h3>
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
            {stats.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <span className="font-medium">{it.refereeName}</span>
                  <span className="ml-2 text-gray-400">{formatDate(it.joinedAt)}</span>
                </div>
                <span className={it.rewardGiven ? "text-green-600" : "text-yellow-600"}>
                  {it.rewardGiven ? "Đã thưởng" : "Đang chờ"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
