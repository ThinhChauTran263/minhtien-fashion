"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface ProductOption {
  id: string;
  name: string;
}

const emptyForm = {
  name: "",
  description: "",
  thumbnail: "",
  discountType: "PERCENT",
  discountValue: 10,
  isActive: true,
  items: [{ productId: "", quantity: 1 }],
};

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/bundles");
      setBundles(res.data.data);
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
      await api.post("/admin/bundles", {
        ...form,
        discountValue: Number(form.discountValue),
        items: form.items.filter((it: any) => it.productId),
      });
      toast.success("Đã tạo combo");
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có l�i xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/admin/bundles/${deleteId}`).catch(() => {});
    setDeleteId(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Combo</h1>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Tạo combo
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Giảm</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bundles.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Chưa có combo</td></tr>
              ) : (
                bundles.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3">{b.items?.length}</td>
                    <td className="px-4 py-3">{b.discountType === "PERCENT" ? `${Number(b.discountValue)}%` : formatPrice(Number(b.discountValue))}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {b.isActive ? "Bật" : "Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer">
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
              <h3 className="text-lg font-semibold">Tạo combo</h3>
              <button onClick={() => setShowForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Tên combo *" required />
              <input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className="input" placeholder="Thumbnail URL" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input">
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Cố định (VNĐ)</option>
                </select>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input" placeholder="Giá tr�9" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm trong combo</p>
                {form.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={it.productId}
                      onChange={(e) => {
                        const items = [...form.items];
                        items[idx].productId = e.target.value;
                        setForm({ ...form, items });
                      }}
                      className="input flex-1"
                    >
                      <option value="">-- Chọn SP --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => {
                        const items = [...form.items];
                        items[idx].quantity = Number(e.target.value);
                        setForm({ ...form, items });
                      }}
                      className="input w-20"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1 }] })} className="text-sm text-primary-800 hover:underline cursor-pointer">
                  + Thêm sản phẩm
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Kích hoạt</span>
              </label>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">{submitting ? "..." : "Tạo combo"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline cursor-pointer">Huỷ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Xoá combo" message="Bạn có chắc mu�n xoá combo này?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

