"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Package, Save, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VariantRow {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  defectiveStock: number;
  product: { id: string; name: string; slug: string; thumbnail: string };
}

interface HistoryRow {
  id: string;
  createdAt: string;
  quantity: number;
  note: string | null;
  variant: {
    sku: string;
    size: string;
    color: string;
    product: { name: string; thumbnail: string };
  };
}

type Tab = "low" | "out" | "defective" | "history";

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<Tab>("low");
  const [items, setItems] = useState<VariantRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, number>>({});
  const [editingNote, setEditingNote] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "low") {
        const res = await adminApi.getLowStock();
        setItems(res.data.data || []);
      } else if (tab === "out") {
        const res = await adminApi.getOutOfStock();
        setItems(res.data.data || []);
      } else if (tab === "defective") {
        const res = await adminApi.getDefectiveStock();
        setItems(res.data.data || []);
      } else if (tab === "history") {
        const res = await adminApi.getDisposalHistory();
        setHistory(res.data.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onUpdate = async (variantId: string) => {
    const value = editing[variantId];
    if (value === undefined) return;
    setSaving(variantId);
    try {
      await adminApi.updateVariantStock(variantId, value);
      setEditing((e) => {
        const cp = { ...e };
        delete cp[variantId];
        return cp;
      });
      fetchData();
    } catch {
      // silent
    } finally {
      setSaving(null);
    }
  };

  const onDispose = async (variantId: string, maxQty: number) => {
    const qty = editing[variantId];
    if (qty === undefined || qty <= 0 || qty > maxQty) return;
    const note = editingNote[variantId] || "";
    setSaving(variantId);
    try {
      await adminApi.disposeDefectiveStock(variantId, qty, note);
      setEditing((e) => {
        const cp = { ...e };
        delete cp[variantId];
        return cp;
      });
      setEditingNote((e) => {
        const cp = { ...e };
        delete cp[variantId];
        return cp;
      });
      fetchData();
    } catch {
      // silent
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tồn kho</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("low")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
            tab === "low"
              ? "bg-primary-800 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Sắp hết
        </button>
        <button
          onClick={() => setTab("out")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
            tab === "out"
              ? "bg-primary-800 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <Package className="w-4 h-4" />
          Đã hết
        </button>
        <button
          onClick={() => setTab("defective")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
            tab === "defective"
              ? "bg-primary-800 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          Hàng lỗi (Grade C)
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
            tab === "history"
              ? "bg-primary-800 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          Lịch sử tiêu hủy
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : tab === "history" ? (
        // LỊCH SỬ TIÊU HỤY
        history.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-400">
            Chưa có lịch sử tiêu hủy
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Sản phẩm</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phân loại</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Số lượng vứt</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(h.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={h.variant.product.thumbnail}
                            alt={h.variant.product.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <span className="font-medium">{h.variant.product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {h.variant.size} / {h.variant.color} (SKU: {h.variant.sku})
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {h.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={h.note || ""}>
                        {h.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-400">
          Không có sản phẩm nào trong danh mục này
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ảnh</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Size / Màu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                  {tab === "defective" ? (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">Tồn lỗi</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 w-[200px]">Lý do / Ghi chú</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">Hành động</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tồn kho bán</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Hành động</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50",
                      v.stock === 0 && tab !== "defective" && "bg-red-50",
                      v.stock > 0 && v.stock <= 3 && tab !== "defective" && "bg-yellow-50",
                      tab === "defective" && "bg-orange-50/30"
                    )}
                  >
                    <td className="px-4 py-3 w-16">
                      <img
                        src={v.product.thumbnail}
                        alt={v.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{v.product.name}</td>
                    <td className="px-4 py-3">
                      {v.size} / {v.color}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                    
                    {tab === "defective" ? (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={v.defectiveStock}
                              placeholder={`Còn ${v.defectiveStock}`}
                              value={editing[v.id] !== undefined ? editing[v.id] : ""}
                              onChange={(e) =>
                                setEditing((cur) => ({
                                  ...cur,
                                  [v.id]: Number(e.target.value),
                                }))
                              }
                              className="w-20 input !py-1 !px-2 text-sm border-red-200 focus:ring-red-500"
                            />
                            <span className="text-xs text-gray-500">/ {v.defectiveStock}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Ghi chú tiêu hủy..."
                            value={editingNote[v.id] !== undefined ? editingNote[v.id] : ""}
                            onChange={(e) =>
                              setEditingNote((cur) => ({
                                ...cur,
                                [v.id]: e.target.value,
                              }))
                            }
                            className="w-full input !py-1 !px-2 text-sm border-red-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onDispose(v.id, v.defectiveStock)}
                            disabled={!editing[v.id] || editing[v.id] <= 0 || editing[v.id] > v.defectiveStock || saving === v.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            {saving === v.id ? "Đang xử lý..." : "Tiêu hủy"}
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            defaultValue={v.stock}
                            onChange={(e) =>
                              setEditing((cur) => ({
                                ...cur,
                                [v.id]: Number(e.target.value),
                              }))
                            }
                            className="w-20 input !py-1 !px-2 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onUpdate(v.id)}
                            disabled={editing[v.id] === undefined || saving === v.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            {saving === v.id ? "Đang lưu..." : "Lưu"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
