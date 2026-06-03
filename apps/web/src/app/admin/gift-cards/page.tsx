"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, Plus, Search, X, History, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/customer-utils";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type GiftCard = {
  id: string;
  code: string;
  amount: string | number;
  balance: string | number;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  source: string;
  recipientEmail?: string | null;
  expiresAt: string;
  beneficiary?: Customer | null;
};

const sourceOptions = [
  { value: "ADMIN_GRANT", label: "Quà tặng" },
  { value: "COMPENSATION", label: "Bồi hoàn" },
  { value: "CUSTOMER_SERVICE", label: "CSKH" },
  { value: "REFUND", label: "Hoàn tiền" },
  { value: "PROMOTION", label: "Khuyến mãi" },
];

const statusOptions = [
  { key: "", label: "Tất cả" },
  { key: "active", label: "Còn hiệu lực" },
  { key: "used", label: "Đã dùng hết" },
  { key: "expired", label: "Hết hạn" },
  { key: "cancelled", label: "Đã hủy" },
];

type LedgerTransaction = {
  id: string;
  type: string;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  note?: string;
  createdAt: string;
  user?: Customer | null;
  order?: { id: string; code: string; total: string | number } | null;
};

export default function AdminGiftCardsPage() {
  const [items, setItems] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<Customer[]>([]);
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    amount: "200000",
    recipientEmail: "",
    recipientName: "",
    message: "",
    expiresAt: "",
    source: "ADMIN_GRANT",
    internalNote: "",
    sendEmail: true,
  });

  const [ledgerCard, setLedgerCard] = useState<GiftCard | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<LedgerTransaction[]>([]);

  const fetchLedger = async (card: GiftCard) => {
    setLedgerCard(card);
    setLedgerLoading(true);
    try {
      const res = await api.get(`/admin/gift-cards/${card.id}/transactions`);
      setLedgerData(res.data.data);
    } catch {
      toast.error("Không thể tải lịch sử giao dịch");
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/gift-cards", {
        params: { ...(status ? { status } : {}), ...(query ? { q: query } : {}) },
      });
      setItems(res.data.data.items);
    } catch {
      toast.error("Không thể tải danh sách gift card");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUsers([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get("/admin/users", { params: { q: userQuery, limit: 8 } });
        setUsers(res.data.data.items);
      } catch {
        setUsers([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [userQuery]);

  const createGiftCard = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error("Mệnh giá không hợp lệ");
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/gift-cards", {
        amount,
        beneficiaryUserId: selectedUser?.id,
        recipientEmail: selectedUser ? undefined : form.recipientEmail || undefined,
        recipientName: selectedUser ? undefined : form.recipientName || undefined,
        message: form.message || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        source: form.source,
        internalNote: form.internalNote || undefined,
        sendEmail: form.sendEmail,
      });
      toast.success("Đã tạo gift card");
      setSelectedUser(null);
      setUserQuery("");
      setForm((current) => ({ ...current, recipientEmail: "", recipientName: "", message: "", internalNote: "" }));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Không tạo được gift card");
    } finally {
      setSaving(false);
    }
  };

  const cancelGiftCard = async (id: string) => {
    const reason = window.prompt("Lý do hủy gift card?") || "Admin cancelled";
    try {
      await api.patch(`/admin/gift-cards/${id}/deactivate`, { reason });
      toast.success("Đã hủy gift card");
      fetchData();
    } catch {
      toast.error("Không hủy được gift card");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
        <p className="mt-1 text-sm text-gray-500">Tạo thẻ quà tặng cá nhân, gắn người thụ hưởng và theo dõi số dư.</p>
      </div>

      <form onSubmit={createGiftCard} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Plus className="h-4 w-4" /> Tạo gift card
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Mệnh giá</span>
            <input className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="numeric" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Nguồn</span>
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Hết hạn</span>
            <input className="input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700">Tài khoản thụ hưởng</label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm">
                <span><b>{selectedUser.name}</b> · {selectedUser.email}</span>
                <button type="button" onClick={() => setSelectedUser(null)} className="rounded p-1 hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-9" placeholder="Tìm tên, email, SĐT customer" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
                </div>
                {users.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-100 bg-white shadow-lg">
                    {users.map((user) => (
                      <button key={user.id} type="button" onClick={() => { setSelectedUser(user); setUsers([]); setUserQuery(""); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                        <b>{user.name}</b><br /><span className="text-xs text-gray-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <p className="mt-1 text-xs text-gray-500">Chọn user thì thẻ được gắn trực tiếp vào tài khoản đó. Không chọn thì admin gửi mã thủ công.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Email nhận</span>
              <input className="input" type="email" disabled={!!selectedUser} value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Tên người nhận</span>
              <input className="input" disabled={!!selectedUser} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Lời nhắn</span>
            <textarea className="input min-h-20 resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={500} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Ghi chú nội bộ</span>
            <textarea className="input min-h-20 resize-none" value={form.internalNote} onChange={(e) => setForm({ ...form, internalNote: e.target.value })} maxLength={500} />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} />
            Gửi email nếu có email người nhận
          </label>
          <button type="submit" disabled={saving} className="btn-primary px-5">
            {saving ? "Đang tạo..." : "Tạo gift card"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => (
          <button key={option.key} onClick={() => setStatus(option.key)} className={cn("rounded-md px-3 py-1.5 text-sm", status === option.key ? "bg-primary-800 text-white" : "border border-gray-200 bg-white")}>{option.label}</button>
        ))}
        <div className="relative ml-auto min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tìm mã, email, user" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Mệnh giá</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Số dư</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Thụ hưởng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">HSD</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((card) => (
                <tr key={card.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{card.code}</td>
                  <td className="px-4 py-3">{formatPrice(Number(card.amount))}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(Number(card.balance))}</td>
                  <td className="px-4 py-3">
                    {card.beneficiary ? <><b>{card.beneficiary.name}</b><br /><span className="text-xs text-gray-500">{card.beneficiary.email}</span></> : <span className="text-gray-500">{card.recipientEmail || "Chưa gắn user"}</span>}
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{card.status}</span></td>
                  <td className="px-4 py-3 text-xs">{formatDate(card.expiresAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => fetchLedger(card)} className="mr-2 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Xem lịch sử (Ledger)"><History className="h-4 w-4" /></button>
                    {card.status !== "CANCELLED" && (
                      <button onClick={() => cancelGiftCard(card.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Hủy gift card"><Ban className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ledgerCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lịch sử giao dịch (Ledger)</h3>
                <p className="mt-1 text-sm text-gray-500">Mã thẻ: <span className="font-mono font-medium text-gray-900">{ledgerCard.code}</span></p>
              </div>
              <button onClick={() => setLedgerCard(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {ledgerLoading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : ledgerData.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-500">Không có giao dịch nào</div>
              ) : (
                <div className="space-y-4">
                  {ledgerData.map((tx) => (
                    <div key={tx.id} className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", tx.type === "ISSUE" ? "bg-green-100 text-green-700" : tx.type === "USE" ? "bg-red-100 text-red-700" : tx.type === "REDEEM" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700")}>
                            {tx.type}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {tx.type === "USE" ? "Sử dụng thanh toán" : tx.type === "ISSUE" ? "Phát hành thẻ" : tx.type === "REDEEM" ? "Gắn thẻ vào tài khoản" : tx.type === "CANCEL" ? "Hủy thẻ" : "Khác"}
                        </p>
                        {tx.note && <p className="mt-1 text-xs text-gray-500">Ghi chú: {tx.note}</p>}
                        {tx.order && <p className="mt-1 text-xs text-gray-500">Đơn hàng: <span className="font-mono font-medium">{tx.order.code}</span></p>}
                        {tx.user && <p className="mt-1 text-xs text-gray-500">User: {tx.user.name} ({tx.user.email})</p>}
                      </div>
                      <div className="text-right">
                        <div className={cn("font-medium", tx.type === "USE" ? "text-red-600" : tx.type === "ISSUE" ? "text-green-600" : "text-gray-900")}>
                          {tx.type === "USE" ? "-" : tx.type === "ISSUE" ? "+" : ""}{formatPrice(Number(tx.amount))}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Số dư: <span className="line-through">{formatPrice(Number(tx.balanceBefore))}</span> → <span className="font-medium text-gray-900">{formatPrice(Number(tx.balanceAfter))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
