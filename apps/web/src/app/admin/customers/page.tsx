"use client";

import { useState } from "react";
import { Edit, Lock, Plus, Search, Trash2, Unlock, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { DataTable, type Column } from "@/components/admin/data-table";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isLocked: boolean;
  lockedAt: string | null;
  lockReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

interface CustomerDetail extends Customer {
  orders: Array<{ id: string; code: string; total: number; status: string; createdAt: string }>;
}

type FormState = { id?: string; name: string; email: string; phone: string; password: string };

const emptyForm: FormState = { name: "", email: "", phone: "", password: "" };

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [lockFilter, setLockFilter] = useState("");
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", { page, search, lockFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.q = search;
      if (lockFilter) params.locked = lockFilter;
      const res = await adminApi.getUsers(params);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const customers = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const { data: selectedCustomer, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "customer", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const res = await adminApi.getUser(selectedCustomerId);
      return res.data.data;
    },
    enabled: !!selectedCustomerId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (form.id) return adminApi.updateUser(form.id, payload);
      return adminApi.createUser(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật khách hàng" : "Đã tạo khách hàng");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Không lưu được khách hàng");
    }
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => adminApi.lockUser(id, reason),
    onSuccess: (_, variables) => {
      toast.success(`Đã khóa tài khoản`);
      setLockModalOpen(false);
      setLockTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => {
      toast.error("Không khóa được tài khoản");
    }
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => adminApi.unlockUser(id),
    onSuccess: () => {
      toast.success("Đã mở khóa tài khoản");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => {
      toast.error("Không mở khóa được tài khoản");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Đã xóa mềm khách hàng");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => {
      toast.error("Không xóa được khách hàng");
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const viewDetail = (id: string) => {
    setSelectedCustomerId(id);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setForm({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone ?? "", password: "" });
    setFormOpen(true);
  };

  const saveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password || undefined,
    };
    saveMutation.mutate(payload);
  };

  // Lock modal state
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Customer | null>(null);
  const [lockReason, setLockReason] = useState("");

  const openLockModal = (customer: Customer) => {
    setLockTarget(customer);
    setLockReason("");
    setLockModalOpen(true);
  };

  const confirmLock = () => {
    if (!lockTarget) return;
    lockMutation.mutate({ id: lockTarget.id, reason: lockReason || "Vi phạm quy định" });
  };

  const unlockCustomer = (customer: Customer) => {
    unlockMutation.mutate(customer.id);
  };

  const deleteCustomer = (customer: Customer) => {
    if (!window.confirm(`Xóa mềm khách hàng ${customer.email}? Tài khoản sẽ không đăng nhập được.`)) return;
    deleteMutation.mutate(customer.id);
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Tên",
      render: (item) => (
        <button onClick={() => viewDetail(item.id)} className="font-medium text-primary-800 hover:underline cursor-pointer">
          {item.name}
        </button>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "SĐT", render: (item) => item.phone || "-" },
    { key: "orders", label: "Số đơn", render: (item) => <span className="font-medium">{item._count.orders}</span> },
    {
      key: "status",
      label: "Trạng thái",
      render: (item) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isLocked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {item.isLocked ? "Đã khóa" : "Hoạt động"}
        </span>
      ),
    },
    { key: "createdAt", label: "Ngày tham gia", render: (item) => formatDate(item.createdAt) },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(item)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer" title="Sửa">
            <Edit className="h-4 w-4" />
          </button>
          {item.isLocked ? (
            <button onClick={() => unlockCustomer(item)} className="rounded p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer" title="Mở khóa">
              <Unlock className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => openLockModal(item)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700 cursor-pointer" title="Khóa">
              <Lock className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => deleteCustomer(item)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700 cursor-pointer" title="Xóa mềm">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Tạo, chỉnh sửa, khóa hoặc mở tài khoản customer.</p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
          <Plus className="h-4 w-4" /> Thêm khách hàng
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex min-w-80 max-w-md flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm theo tên, email, SĐT..." className="input pl-10" />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 cursor-pointer">Tìm</button>
        </form>
        <select value={lockFilter} onChange={(e) => { setPage(1); setLockFilter(e.target.value); }} className="input w-44">
          <option value="">Tất cả trạng thái</option>
          <option value="false">Hoạt động</option>
          <option value="true">Đã khóa</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><div className="animate-pulse text-gray-400">Đang tải...</div></div>
      ) : (
        <DataTable columns={columns} data={customers} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="Không tìm thấy khách hàng nào" />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFormOpen(false)} />
          <form onSubmit={saveCustomer} className="relative mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold">{form.id ? "Cập nhật khách hàng" : "Thêm khách hàng"}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded p-1 hover:bg-gray-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Họ tên</span><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Email</span><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Số điện thoại</span><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Mật khẩu {form.id ? "mới" : ""}</span><input type="password" className="input" required={!form.id} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={form.id ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"} /></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50">Hủy</button>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-5 cursor-pointer">{saveMutation.isPending ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lock Account Modal */}
      {lockModalOpen && lockTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLockModalOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-center text-lg font-semibold text-gray-900">Khóa tài khoản</h3>
              <p className="mt-1 text-center text-sm text-gray-500">
                Tài khoản <span className="font-medium text-gray-700">{lockTarget.email}</span> sẽ không thể đăng nhập sau khi bị khóa.
              </p>
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700">Lý do khóa <span className="text-red-500">*</span></label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do khóa tài khoản..."
                  className="input mt-1.5 resize-none"
                  autoFocus
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Vi phạm quy định", "Spam/lừa đảo", "Yêu cầu từ khách hàng", "Tài khoản trùng lặp"].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setLockReason(reason)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setLockModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmLock}
                disabled={!lockReason.trim() || lockMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {lockMutation.isPending ? "Đang khóa..." : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(selectedCustomerId || detailLoading) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCustomerId(null)} />
          <div className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold">Chi tiết khách hàng</h3>
              <button onClick={() => setSelectedCustomerId(null)} className="rounded p-1 hover:bg-gray-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            {detailLoading ? <div className="p-6 text-center text-gray-400">Đang tải...</div> : selectedCustomer ? (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Tên</p><p className="font-medium">{selectedCustomer.name}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedCustomer.email}</p></div>
                  <div><p className="text-gray-500">SĐT</p><p className="font-medium">{selectedCustomer.phone || "-"}</p></div>
                  <div><p className="text-gray-500">Ngày tham gia</p><p className="font-medium">{formatDate(selectedCustomer.createdAt)}</p></div>
                  <div><p className="text-gray-500">Tổng đơn hàng</p><p className="font-medium">{selectedCustomer._count.orders}</p></div>
                  <div><p className="text-gray-500">Trạng thái</p><p className="font-medium">{selectedCustomer.isLocked ? `Đã khóa${selectedCustomer.lockReason ? `: ${selectedCustomer.lockReason}` : ""}` : "Hoạt động"}</p></div>
                </div>
                <div>
                  <h4 className="mb-3 font-medium text-gray-900">Lịch sử đơn hàng</h4>
                  {selectedCustomer.orders.length === 0 ? <p className="text-sm text-gray-400">Chưa có đơn hàng nào</p> : (
                    <div className="space-y-2">
                      {selectedCustomer.orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
                          <div><span className="font-medium">{order.code}</span><span className="ml-3 text-gray-500">{formatDate(order.createdAt)}</span></div>
                          <div className="flex items-center gap-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || ""}`}>{statusLabels[order.status] || order.status}</span><span className="font-medium">{formatPrice(Number(order.total))}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
