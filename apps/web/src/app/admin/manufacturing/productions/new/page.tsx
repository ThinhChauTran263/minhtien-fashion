"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi, productApi } from "@/lib/api";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [rolls, setRolls] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [code, setCode] = useState("");
  const [rollId, setRollId] = useState("");
  const [usedLength, setUsedLength] = useState<number>(0);
  const [wastedLength, setWastedLength] = useState<number>(0);
  const [additionalCostPerItem, setAdditionalCostPerItem] = useState<number>(0);
  const [additionalCostNote, setAdditionalCostNote] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<
    { productId: string; variantId: string; yieldQuantity: number; availableVariants: any[] }[]
  >([]);

  useEffect(() => {
    adminApi.getMaterialRolls().then((res) => {
      // Chỉ lấy các cây còn vải
      setRolls((res.data || []).filter((r: any) => Number(r.currentLength) > 0));
    });
    adminApi.getProducts().then((res) => {
      setProducts(res.data.data || []);
    });
    setCode(`LSX-${Date.now().toString().slice(-6)}`);
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { productId: "", variantId: "", yieldQuantity: 1, availableVariants: [] },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onProductChange = async (index: number, productId: string) => {
    const newItems = [...items];
    newItems[index].productId = productId;
    newItems[index].variantId = "";
    
    if (productId) {
      try {
        const res = await adminApi.getProduct(productId);
        newItems[index].availableVariants = res.data.data?.variants || [];
      } catch {
        newItems[index].availableVariants = [];
      }
    } else {
      newItems[index].availableVariants = [];
    }
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const selectedRoll = rolls.find((r) => r.id === rollId);
  const totalYield = items.reduce((sum, item) => sum + Number(item.yieldQuantity || 0), 0);

  // Tính dự kiến giá vốn
  let estimatedCostPerItem = 0;
  if (selectedRoll && totalYield > 0 && (usedLength + wastedLength) > 0) {
    const fabricCostRatio = (usedLength + wastedLength) / Number(selectedRoll.originalLength);
    const fabricCost = fabricCostRatio * Number(selectedRoll.costPrice);
    estimatedCostPerItem = (fabricCost / totalYield) + additionalCostPerItem;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollId) return alert("Vui lòng chọn cây vải");
    if (items.length === 0) return alert("Vui lòng thêm ít nhất 1 size thành phẩm");
    if (items.some((i) => !i.variantId || i.yieldQuantity <= 0)) {
      return alert("Vui lòng chọn đúng size và số lượng > 0 cho tất cả sản phẩm");
    }

    setLoading(true);
    try {
      await adminApi.createProduction({
        code,
        rollId,
        usedLength,
        wastedLength,
        additionalCostPerItem,
        additionalCostNote,
        note,
        items: items.map((i) => ({
          variantId: i.variantId,
          yieldQuantity: i.yieldQuantity,
        })),
      });
      router.push("/admin/manufacturing");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/manufacturing" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lệnh Cắt May</h1>
          <p className="text-gray-500">Tạo lệnh xuất vải để cắt và nhập kho thành phẩm</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã Lệnh Sản Xuất</label>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Chọn Cây Vải (Nguyên liệu)</label>
              <select
                required
                value={rollId}
                onChange={(e) => setRollId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">-- Chọn cây vải --</option>
                {rolls.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rollCode} ({r.material.name}{r.color ? ` - ${r.color}` : ""}) - Còn: {Number(r.currentLength)}m
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số mét đã cắt ra áo (m)
              </label>
              <input
                required
                type="number"
                step="0.1"
                min="0.1"
                value={usedLength}
                onChange={(e) => setUsedLength(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số mét hao hụt / bỏ đi (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={wastedLength}
                onChange={(e) => setWastedLength(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Chi phí phụ liệu & gia công / 1 áo (VNĐ)
              </label>
              <div className="text-xs text-gray-500 mb-1">Ví dụ: In 10k + tem mác 5k = 15000</div>
              <input
                type="number"
                min="0"
                value={additionalCostPerItem}
                onChange={(e) => setAdditionalCostPerItem(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú phụ liệu</label>
              <input
                type="text"
                placeholder="VD: In hình ngực trái, Mác dệt"
                value={additionalCostNote}
                onChange={(e) => setAdditionalCostNote(e.target.value)}
                className="mt-1 mt-5 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Danh sách thành phẩm nhập kho</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              <Plus className="h-4 w-4" />
              Thêm size áo
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mẫu áo (Sản phẩm gốc)</label>
                    <select
                      value={item.productId}
                      onChange={(e) => onProductChange(index, e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Size / Màu (Variant)</label>
                    <select
                      required
                      value={item.variantId}
                      disabled={!item.productId}
                      onChange={(e) => updateItem(index, "variantId", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">-- Chọn Size --</option>
                      {item.availableVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.size} - {v.color} (SKU: {v.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Số lượng may được (Cái)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={item.yieldQuantity}
                      onChange={(e) => updateItem(index, "yieldQuantity", Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-6 text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4 border-2 border-dashed rounded-lg">
                Chưa thêm thành phẩm nào. Vui lòng bấm "Thêm size áo".
              </div>
            )}
          </div>

          <div className="rounded-lg bg-blue-50 p-4 mt-4 border border-blue-100 text-blue-800 text-sm">
            <div className="font-medium mb-2">Báo cáo dự kiến:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Tổng xuất kho: <strong>{(usedLength + wastedLength).toFixed(1)} m</strong></li>
              <li>Tổng thành phẩm: <strong>{totalYield} cái áo</strong></li>
              <li>Giá vốn tổng hợp ước tính: <strong>{estimatedCostPerItem.toLocaleString()} đ / cái</strong></li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Lưu & Nhập Kho"}
          </button>
        </div>
      </form>
    </div>
  );
}
