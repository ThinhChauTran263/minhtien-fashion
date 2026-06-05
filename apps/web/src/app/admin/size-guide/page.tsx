"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi, categoryApi, sizeGuideApi } from "@/lib/api";
import { getSizeGuideData, type SizeGuideData } from "@/components/product/size-guide-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>("");
  const [data, setData] = useState<SizeGuideData>(getSizeGuideData());

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: sizeGuideData, isLoading } = useQuery({
    queryKey: ["admin", "size-guide", categoryId],
    queryFn: async () => {
      const res = await sizeGuideApi.get(categoryId || null);
      return res.data.data?.data;
    },
  });

  useEffect(() => {
    if (sizeGuideData !== undefined) {
      setData(getSizeGuideData(sizeGuideData));
    }
  }, [sizeGuideData]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const update = (size: string, field: string, value: string) => {
    setData((current) => ({ ...current, [size]: { ...current[size], [field]: ["chest", "length", "shoulder"].includes(field) ? Number(value) : value } }));
  };

  const saveMutation = useMutation({
    mutationFn: () => adminApi.upsertSizeGuide({ categoryId: categoryId || null, data }),
    onSuccess: () => {
      toast.success("Đã lưu bảng size");
      queryClient.invalidateQueries({ queryKey: ["admin", "size-guide", categoryId] });
    },
    onError: () => {
      toast.error("Không lưu được bảng size");
    }
  });

  const save = () => {
    saveMutation.mutate();
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
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 block w-full max-w-sm rounded border border-gray-200 px-3 py-2 cursor-pointer bg-white">
            <option value="">Mặc định</option>
            {flatCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-gray-400">Đang tải...</div>
          </div>
        ) : (
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
        )}

        <button type="button" onClick={save} disabled={saveMutation.isPending} className="mt-5 rounded bg-primary-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-60 cursor-pointer">
          {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}

