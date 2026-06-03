"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface Voucher {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const typeLabels: Record<string, string> = {
  PERCENT: "Phần trăm",
  FIXED: "Cố định",
  FREE_SHIPPING: "Free ship",
};

const defaultForm = {
  code: "",
  description: "",
  type: "PERCENT" as string,
  value: 0,
  minOrder: 0,
  maxDiscount: 0,
  usageLimit: 100,
  perUserLimit: 1,
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVouchers({ page, limit: 20 });
      setVouchers(res.data.data.items);
      setTotalPages(res.data.data.totalPages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code,
      description: voucher.description || "",
      type: voucher.type,
      value: Number(voucher.value),
      minOrder: voucher.minOrder ? Number(voucher.minOrder) : 0,
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : 0,
      usageLimit: voucher.usageLimit || 100,
      perUserLimit: voucher.perUserLimit,
      startsAt: voucher.startsAt ? voucher.startsAt.slice(0, 16) : "",
      expiresAt: voucher.expiresAt ? voucher.expiresAt.slice(0, 16) : "",
      isActive: voucher.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: Number(form.perUserLimit),
      };

      if (editingId) {
        await adminApi.updateVoucher(editingId, payload);
      } else {
        await adminApi.createVoucher(payload);
      }
      setShowForm(false);
      fetchVouchers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminApi.deleteVoucher(deleteId);
      setDeleteId(null);
      fetchVouchers();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Voucher>[] = [
    {
      key: "code",
      label: "Code",
      render: (item) => <span className="font-mono font-medium">{item.code}</span>,
    },
    {
      key: "type",
      label: "Loại",
      render: (item) => typeLabels[item.type] || item.type,
    },
    {
      key: "value",
      label: "Giá trị",
      render: (item) =>
        item.type === "PERCENT"
          ? `${Number(item.value)}%`
          : item.type === "FREE_SHIPPING"
          ? "Free ship"
          : formatPrice(Number(item.value)),
    },
    {
      key: "minOrder",
      label: "Đơn tối thiểu",
      render: (item) => item.minOrder ? formatPrice(Number(item.minOrder)) : "—",
    },
    {
      key: "usage",
      label: "Lượt dùng",
      render: (item) => `${item.usageCount}/${item.usageLimit || "âˆž"}`,
    },
    {
      key: "expiresAt",
      label: "Hạn",
      render: (item) => formatDate(item.expiresAt),
    },
    {
      key: "isActive",
      label: "Trạng thái",
      render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {item.isActive ? "Hoạt động" : "Tắt"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24",
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(item)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-800 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(item.id)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Thêm voucher
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={vouchers}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="Chưa có voucher nào"
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Sửa voucher" : "Thêm voucher"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input font-mono"
                    placeholder="SALE20"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input"
                    placeholder="Giảm 20% cho đơn từ 500K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Cố định (VNĐ)</option>
                    <option value="FREE_SHIPPING">Free ship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị {form.type === "PERCENT" ? "(%)" : "(VNĐ)"}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                  <input
                    type="number"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    className="input"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn/user</label>
                  <input
                    type="number"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                    className="input"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="input"
                    required
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
                <span className="text-sm text-gray-700">Kích hoạt</span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">
                  {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo voucher"}
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
        title="Xóa voucher"
        message="Bạn có chắc muốn xóa voucher này? Hành động không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

