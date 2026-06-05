"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Scissors, Layers, Package } from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "materials" | "rolls" | "productions";

export default function ManufacturingPage() {
  const [tab, setTab] = useState<Tab>("rolls");
  const [materials, setMaterials] = useState<any[]>([]);
  const [rolls, setRolls] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMaterialCode, setNewMaterialCode] = useState("");
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("mét");
  const [creatingMaterial, setCreatingMaterial] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "materials") {
        const res = await adminApi.getMaterials();
        setMaterials(res.data || []);
      } else if (tab === "rolls") {
        const res = await adminApi.getMaterialRolls();
        setRolls(res.data || []);
      } else if (tab === "productions") {
        const res = await adminApi.getProductions();
        setProductions(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName || !newMaterialCode) return;
    setCreatingMaterial(true);
    try {
      await adminApi.createMaterial({
        code: newMaterialCode,
        name: newMaterialName,
        unit: newMaterialUnit,
      });
      setNewMaterialCode("");
      setNewMaterialName("");
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setCreatingMaterial(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sản xuất & Kho Vải</h1>
          <p className="text-gray-500">Quản lý nguyên phụ liệu và lệnh cắt may thành phẩm</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/manufacturing/receipts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Nhập Vải
          </Link>
          <Link
            href="/admin/manufacturing/productions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Scissors className="h-4 w-4" />
            Lệnh Cắt May
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab("rolls")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              tab === "rolls"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Kho Cây Vải
          </button>
          <button
            onClick={() => setTab("productions")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              tab === "productions"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Lịch sử Sản xuất
          </button>
          <button
            onClick={() => setTab("materials")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              tab === "materials"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Danh mục Loại vải
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải...</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {tab === "rolls" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-900">Mã cây vải</th>
                    <th className="px-6 py-4 font-medium text-gray-900">Loại vải</th>
                    <th className="px-6 py-4 font-medium text-gray-900">Màu sắc</th>
                    <th className="px-6 py-4 font-medium text-gray-900">Nhà cung cấp</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Giá gốc</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Ban đầu</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Hiện tại</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rolls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Chưa có cây vải nào trong kho.
                      </td>
                    </tr>
                  ) : (
                    rolls.map((r) => {
                      const isZero = Number(r.currentLength) <= 0;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{r.rollCode}</td>
                          <td className="px-6 py-4 text-gray-500">{r.material?.name}</td>
                          <td className="px-6 py-4 text-gray-500">{r.color || "-"}</td>
                          <td className="px-6 py-4 text-gray-500">{r.receipt?.supplierName || "-"}</td>
                          <td className="px-6 py-4 text-right">
                            {Number(r.costPrice).toLocaleString()} đ
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {Number(r.originalLength)}m
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {Number(r.currentLength)}m
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isZero ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                Đã hết
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Còn vải
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "productions" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-900">Mã lệnh</th>
                    <th className="px-6 py-4 font-medium text-gray-900">Cây vải</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Đã cắt</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Hao hụt</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-center">Sản phẩm</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Gia công/áo</th>
                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Giá vốn tổng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Chưa có lệnh sản xuất nào.
                      </td>
                    </tr>
                  ) : (
                    productions.map((p) => {
                      const totalYield = p.items.reduce((s: any, i: any) => s + i.yieldQuantity, 0);
                      const costPerItem = p.items[0]?.costPerItem || 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{p.code}</td>
                          <td className="px-6 py-4 text-gray-500">{p.roll?.rollCode}</td>
                          <td className="px-6 py-4 text-right font-medium text-blue-600">{Number(p.usedLength)}m</td>
                          <td className="px-6 py-4 text-right text-red-500">{Number(p.wastedLength)}m</td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-green-600">+{totalYield} áo</span>
                            <div className="text-xs text-gray-400 mt-1">
                              {p.items.map((i: any) => `${i.variant?.size}: ${i.yieldQuantity}`).join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {Number(p.additionalCostPerItem).toLocaleString()} đ
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {Number(costPerItem).toLocaleString()} đ
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "materials" && (
            <div className="p-6">
              <form onSubmit={handleCreateMaterial} className="mb-6 flex items-end gap-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã loại vải</label>
                  <input
                    required
                    type="text"
                    placeholder="VD: CT01"
                    value={newMaterialCode}
                    onChange={(e) => setNewMaterialCode(e.target.value)}
                    className="block w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên loại vải</label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Cotton 100%"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="block w-64 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đơn vị đo</label>
                  <input
                    required
                    type="text"
                    value={newMaterialUnit}
                    onChange={(e) => setNewMaterialUnit(e.target.value)}
                    className="block w-24 rounded-md border border-gray-300 px-3 py-2 text-sm text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingMaterial}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {creatingMaterial ? "Đang thêm..." : "Thêm loại vải"}
                </button>
              </form>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-900">Mã loại</th>
                      <th className="px-6 py-4 font-medium text-gray-900">Tên loại vải</th>
                      <th className="px-6 py-4 font-medium text-gray-900">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {materials.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          Chưa có loại vải nào được định nghĩa.
                        </td>
                      </tr>
                    ) : (
                      materials.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{m.code}</td>
                          <td className="px-6 py-4">{m.name}</td>
                          <td className="px-6 py-4 text-gray-500">{m.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
