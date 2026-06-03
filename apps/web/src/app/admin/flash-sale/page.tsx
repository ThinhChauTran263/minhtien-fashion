"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, adminApi } from "@/lib/api";
import { formatDate } from "@/lib/customer-utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const emptyForm = {
  name: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  items: [{ productId: "", salePrice: 0, quantity: 10 }],
};

export default function AdminFlashSalePage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFlashSales();
      setSales(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    adminApi.getProducts({ limit: 100 }).then((res) => {
      setProducts(res.data.data.items.map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createFlashSale({
        ...form,
        items: form.items
          .filter((it: any) => it.productId)
          .map((it: any) => ({ ...it, salePrice: Number(it.salePrice), quantity: Number(it.quantity) })),
      });
      toast.success("Đã tạo flash sale");
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await adminApi.deleteFlashSale(deleteId).catch(() => {});
    setDeleteId(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Flash Sale</h1>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Tạo Flash Sale
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SP</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Bắt đầu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kết thúc</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chưa có flash sale</td></tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s._count?.items ?? 0}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(s.startsAt)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(s.endsAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.isActive ? "Bật" : "Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tạo Flash Sale</h3>
              <button onClick={() => setShowForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Tên flash sale *" required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bắt đầu</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kết thúc</label>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="input" required />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</p>
                {form.items.map((it: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-[1fr_90px_70px] gap-2 mb-2">
                    <select
                      value={it.productId}
                      onChange={(e) => { const items = [...form.items]; items[idx].productId = e.target.value; setForm({ ...form, items }); }}
                      className="input"
                    >
                      <option value="">-- SP --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" placeholder="Giá sale" value={it.salePrice} onChange={(e) => { const items = [...form.items]; items[idx].salePrice = e.target.value; setForm({ ...form, items }); }} className="input" />
                    <input type="number" placeholder="SL" value={it.quantity} onChange={(e) => { const items = [...form.items]; items[idx].quantity = e.target.value; setForm({ ...form, items }); }} className="input" />
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", salePrice: 0, quantity: 10 }] })} className="text-sm text-primary-800 hover:underline cursor-pointer">
                  + Thêm sản phẩm
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Kích hoạt</span>
              </label>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">{submitting ? "..." : "Tạo"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline cursor-pointer">Huỷ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Xoá flash sale" message="Bạn có chắc muốn xoá?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

