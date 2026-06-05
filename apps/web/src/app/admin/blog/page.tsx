"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { formatDate } from "@/lib/customer-utils";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: async () => {
      const res = await api.get("/admin/blog/posts");
      return res.data.data.items || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog/posts/${id}`),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
    }
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
        <Link href="/admin/blog/new" className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Viết bài
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-40 items-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Danh mục</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lượt xem</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chưa có bài viết</td></tr>
              ) : (
                items.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3">{p.category?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isPublished ? "Đã đăng" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.viewCount}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/admin/blog/${p.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-800 cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Xoá bài viết"
        message="Bạn có chắc muốn xoá bài viết này?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

