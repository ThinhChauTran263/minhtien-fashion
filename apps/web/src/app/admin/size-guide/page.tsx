"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminApi, categoryApi, sizeGuideApi } from "@/lib/api";
import { getSizeGuideData, type SizeGuideData } from "@/components/product/size-guide-table";

const sizes = ["S", "M", "L", "XL", "XXL"];
const fields = [
  ["chest", "Ngực"],
  ["length", "Dài áo"],
  ["shoulder", "Vai"],
  ["weight", "Cân nặng"],
  ["height", "Chiều cao"],
] as const;

function flattenCategories(categories: any[]): any[] {
  return categories.flatMap((category) => [category, ...(category.children ? flattenCategories(category.children) : [])]);
}

export default function AdminSizeGuidePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [data, setData] = useState<SizeGuideData>(getSizeGuideData());
  const [saving, setSaving] = useState(false);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    sizeGuideApi.get(categoryId || null).then((res) => setData(getSizeGuideData(res.data.data?.data)));
  }, [categoryId]);

  const update = (size: string, field: string, value: string) => {
    setData((current) => ({ ...current, [size]: { ...current[size], [field]: ["chest", "length", "shoulder"].includes(field) ? Number(value) : value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.upsertSizeGuide({ categoryId: categoryId || null, data });
      toast.success("Đã lưu bảng size");
    } catch {
      toast.error("Không lưu được bảng size");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý bảng size</h1>
        <p className="mt-1 text-sm text-gray-500">Cập nhật bảng size mặc định hoặc theo danh mục.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="mb-4 block text-sm font-medium">
          Danh mục
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 block w-full max-w-sm rounded border border-gray-200 px-3 py-2">
            <option value="">Mặc định</option>
            {flatCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Size</th>
                {fields.map(([, label]) => <th key={label} className="p-3 text-left">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size} className="border-t border-gray-100">
                  <td className="p-3 font-semibold">{size}</td>
                  {fields.map(([field]) => (
                    <td key={field} className="p-3">
                      <input value={String(data[size]?.[field] ?? "")} onChange={(e) => update(size, field, e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={save} disabled={saving} className="mt-5 rounded bg-primary-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}

