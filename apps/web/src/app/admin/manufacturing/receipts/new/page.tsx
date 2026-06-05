"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  const [code, setCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [note, setNote] = useState("");
  const [rolls, setRolls] = useState<
    { materialId: string; rollCode: string; color: string; length: number; costPrice: number }[]
  >([]);

  const [showNewMaterial, setShowNewMaterial] = useState(false);
  const [newMaterialCode, setNewMaterialCode] = useState("");
  const [newMaterialName, setNewMaterialName] = useState("");
  const [creatingMaterial, setCreatingMaterial] = useState(false);

  const fetchMaterials = () => {
    adminApi.getMaterials().then((res) => {
      setMaterials(res.data || []);
    });
  };
  useEffect(() => {
    fetchMaterials();
    // Auto generate a code
    setCode(`PN-${Date.now().toString().slice(-6)}`);
  }, []);

  const handleCreateMaterial = async () => {
    if (!newMaterialCode || !newMaterialName) return alert("Vui lòng điền đủ Mã và Tên loại vải");
    setCreatingMaterial(true);
    try {
      const res = await adminApi.createMaterial({ code: newMaterialCode, name: newMaterialName, unit: "mét" });
      setShowNewMaterial(false);
      setNewMaterialCode("");
      setNewMaterialName("");
      fetchMaterials();
      
      // Auto select the new material for all rolls that don't have a material
      const newId = res.data?.id;
      if (newId) {
        setRolls(rolls.map(r => r.materialId ? r : { ...r, materialId: newId }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi tạo loại vải");
    } finally {
      setCreatingMaterial(false);
    }
  };

  const addRoll = () => {
    setRolls([
      ...rolls,
      {
        materialId: materials[0]?.id || "",
        rollCode: `CV-${Date.now().toString().slice(-6)}`,
        color: "",
        length: 100,
        costPrice: 0,
      },
    ]);
  };

  const removeRoll = (index: number) => {
    setRolls(rolls.filter((_, i) => i !== index));
  };

  const updateRoll = (index: number, field: string, value: any) => {
    const newRolls = [...rolls];
    (newRolls[index] as any)[field] = value;
    setRolls(newRolls);
  };

  const totalAmount = rolls.reduce((sum, r) => sum + r.costPrice, 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rolls.length === 0) return alert("Vui lòng thêm ít nhất 1 cây vải");
    if (rolls.some((r) => !r.materialId)) return alert("Vui lòng chọn loại vải cho tất cả các cây");

    setLoading(true);
    try {
      await adminApi.createMaterialReceipt({
        code,
        supplierName,
        note,
        totalAmount,
        rolls,
      });
      router.push("/admin/manufacturing");
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nhập Vải Mới</h1>
          <p className="text-gray-500">Tạo phiếu nhập các cây vải từ nhà cung cấp</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã phiếu nhập</label>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="VD: Chợ Ninh Hiệp"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={2}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Danh sách cây vải</h2>
            <button
              type="button"
              onClick={addRoll}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              <Plus className="h-4 w-4" />
              Thêm cây vải
            </button>
          </div>

          <div className="space-y-3">
            {rolls.map((roll, index) => (
              <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-500">Loại vải</label>
                      {index === 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewMaterial(!showNewMaterial)}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          + Thêm mới
                        </button>
                      )}
                    </div>
                    <select
                      required
                      value={roll.materialId}
                      onChange={(e) => updateRoll(index, "materialId", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">-- Chọn loại --</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    
                    {index === 0 && showNewMaterial && (
                      <div className="mt-2 p-2 border rounded bg-white shadow-sm space-y-2">
                        <input
                          type="text"
                          placeholder="Mã vải (VD: KAKI)"
                          value={newMaterialCode}
                          onChange={(e) => setNewMaterialCode(e.target.value)}
                          className="block w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Tên vải (VD: Kaki Thun)"
                          value={newMaterialName}
                          onChange={(e) => setNewMaterialName(e.target.value)}
                          className="block w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setShowNewMaterial(false)}
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateMaterial}
                            disabled={creatingMaterial}
                            className="px-2 py-1 text-xs bg-primary-600 text-white hover:bg-primary-700 rounded disabled:opacity-50"
                          >
                            {creatingMaterial ? "..." : "Lưu"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mã cây vải</label>
                    <input
                      required
                      type="text"
                      value={roll.rollCode}
                      onChange={(e) => updateRoll(index, "rollCode", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Màu sắc</label>
                    <input
                      type="text"
                      placeholder="VD: Đỏ, Xanh..."
                      value={roll.color}
                      onChange={(e) => updateRoll(index, "color", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Số mét (m)</label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={roll.length}
                      onChange={(e) => updateRoll(index, "length", Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Giá tiền cây (VNĐ)</label>
                    <input
                      required
                      type="number"
                      value={roll.costPrice}
                      onChange={(e) => updateRoll(index, "costPrice", Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRoll(index)}
                  className="mt-6 text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {rolls.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4 border-2 border-dashed rounded-lg">
                Chưa có cây vải nào. Vui lòng bấm "Thêm cây vải".
              </div>
            )}
          </div>
          <div className="flex justify-end border-t pt-4 mt-4">
            <div className="text-right">
              <span className="text-sm text-gray-500">Tổng cộng: </span>
              <span className="text-lg font-bold text-primary-700">{totalAmount.toLocaleString()} đ</span>
            </div>
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
            {loading ? "Đang lưu..." : "Lưu Phiếu Nhập"}
          </button>
        </div>
      </form>
    </div>
  );
}
