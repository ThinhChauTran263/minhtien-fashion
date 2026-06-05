"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface Banner {
  id: string;
  title: string;
  image: string;
  imageMobile: string | null;
  link: string | null;
  position: string;
  order: number;
  isActive: boolean;
}

const positionLabels: Record<string, string> = {
  "home-hero": "Trang chủ - Hero",
  "home-sub": "Trang chủ - Phụ",
  "category-top": "Danh mục - Đầu trang",
};

const defaultForm = {
  title: "",
  image: "",
  imageMobile: "",
  link: "",
  position: "home-hero",
  order: 0,
  isActive: true,
};

export default function AdminBannerPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const res = await adminApi.getBanners();
      return res.data.data || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingId) {
        return adminApi.updateBanner(editingId, payload);
      } else {
        return adminApi.createBanner(payload);
      }
    },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Có l i xảy ra");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    }
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      image: banner.image,
      imageMobile: banner.imageMobile || "",
      link: banner.link || "",
      position: banner.position,
      order: banner.order,
      isActive: banner.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const payload = {
      ...form,
      order: Number(form.order),
      imageMobile: form.imageMobile || undefined,
      link: form.link || undefined,
    };
    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Banner</h1>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Thêm banner
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
          Chưa có banner nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner: any) => (
            <div key={banner.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Image Preview */}
              <div className="relative aspect-[16/6] bg-gray-100">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='150' fill='%23f3f4f6'%3E%3Crect width='400' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EKhông tải  ược ảnh%3C/text%3E%3C/svg%3E";
                  }}
                />
                {!banner.isActive && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-800/70 text-white text-xs rounded">
                    Ẩn
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{banner.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {positionLabels[banner.position] || banner.position} ⬢ Thứ tự: {banner.order}
                    </p>
                    {banner.link && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{banner.link}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(banner)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(banner.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Sửa banner" : "Thêm banner"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu  ề *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Banner khuyến mãi hè"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL ảnh *</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input"
                  placeholder="https://example.com/banner.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL ảnh mobile</label>
                <input
                  type="url"
                  value={form.imageMobile}
                  onChange={(e) => setForm({ ...form, imageMobile: e.target.value })}
                  className="input"
                  placeholder="https://example.com/banner-mobile.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link  ích</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="input"
                  placeholder="/ao-co-co"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">V9 trí *</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="input"
                  >
                    <option value="home-hero">Trang chủ - Hero</option>
                    <option value="home-sub">Trang chủ - Phụ</option>
                    <option value="category-top">Danh mục - Đầu trang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="input"
                    min={0}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">HiỒn th9</span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary cursor-pointer">
                  {saveMutation.isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo banner"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline cursor-pointer">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Xóa banner"
        message="Bạn có chắc muốn xóa banner này? Hành động không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
