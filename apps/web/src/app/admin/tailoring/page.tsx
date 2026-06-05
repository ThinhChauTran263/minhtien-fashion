"use client";

import { useState } from "react";
import { Scissors, Phone, Mail, X, Trash2, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface TailoringRequest {
  id: string;
  requestType: "CUSTOM" | "BULK";
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  quantity: number | null;
  requirements: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Mới", cls: "bg-blue-50 text-blue-700" },
  CONTACTED: { label: "Đã liên hệ", cls: "bg-amber-50 text-amber-700" },
  DONE: { label: "Hoàn tất", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" },
};

const REQUEST_TYPES: Record<string, { label: string; cls: string }> = {
  CUSTOM: { label: "Cá nhân", cls: "bg-gray-100 text-gray-600" },
  BULK: { label: "Số lượng lớn", cls: "bg-purple-50 text-purple-700" },
};

export default function AdminTailoringPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");
  const [selected, setSelected] = useState<TailoringRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tailoring", { page, statusFilter, requestTypeFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (requestTypeFilter) params.requestType = requestTypeFilter;
      const res = await adminApi.getTailoringRequests(params);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const newCount = data?.newCount || 0;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateTailoringRequest(id, { status }),
    onSuccess: (_, variables) => {
      toast.success("Đã cập nhật trạng thái");
      setSelected((cur) => (cur && cur.id === variables.id ? { ...cur, status: variables.status } : cur));
      queryClient.invalidateQueries({ queryKey: ["admin", "tailoring"] });
    },
    onError: () => {
      toast.error("Không cập nhật được");
    }
  });

  const saveNoteMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote: string }) => adminApi.updateTailoringRequest(id, { adminNote }),
    onSuccess: () => {
      toast.success("Đã lưu ghi chú");
      queryClient.invalidateQueries({ queryKey: ["admin", "tailoring"] });
    },
    onError: () => {
      toast.error("Không lưu được ghi chú");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTailoringRequest(id),
    onSuccess: () => {
      toast.success("Đã xóa");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "tailoring"] });
    },
    onError: () => {
      toast.error("Không xóa được");
    }
  });

  const updateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const saveNote = () => {
    if (!selected) return;
    saveNoteMutation.mutate({ id: selected.id, adminNote: selected.adminNote ?? "" });
  };

  const remove = (id: string) => {
    if (!window.confirm("Xóa yêu cầu này?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Scissors className="h-6 w-6" /> Hòm thư đặt may
            {newCount > 0 && (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">{newCount} mới</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Yêu cầu đặt may cá nhân, đồng phục công ty và áo team building.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={requestTypeFilter} onChange={(e) => { setPage(1); setRequestTypeFilter(e.target.value); }} className="input w-48">
            <option value="">Tất cả loại yêu cầu</option>
            {Object.entries(REQUEST_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="input w-48">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center">
          <Scissors className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Chưa có yêu cầu đặt may nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item: any) => (
            <button key={item.id} onClick={() => setSelected(item)} className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 text-left transition-shadow hover:shadow-md cursor-pointer">
              <div className="mb-2 flex items-start justify-between gap-2 w-full">
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS[item.status]?.cls}`}>
                  {STATUS[item.status]?.label ?? item.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {item.phone}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_TYPES[item.requestType]?.cls ?? REQUEST_TYPES.CUSTOM.cls}`}>
                  {REQUEST_TYPES[item.requestType]?.label ?? item.requestType}
                </span>
              </div>
              {item.requestType === "BULK" && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {item.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {item.company}</span>}
                  {item.quantity && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {item.quantity} áo</span>}
                </div>
              )}
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">{item.requirements}</p>
              <span className="mt-3 text-xs text-gray-400">{formatDate(item.createdAt)}</span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 cursor-pointer hover:bg-gray-50">Trước</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 cursor-pointer hover:bg-gray-50">Sau</button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold">Chi tiết yêu cầu</h3>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Khách hàng</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{selected.name}</p>
              </div>
              <div className="flex flex-col gap-2">
                <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary-800 hover:underline"><Phone className="h-4 w-4" /> {selected.phone}</a>
                {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:underline"><Mail className="h-4 w-4" /> {selected.email}</a>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Loại yêu cầu</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${REQUEST_TYPES[selected.requestType]?.cls ?? REQUEST_TYPES.CUSTOM.cls}`}>
                  {REQUEST_TYPES[selected.requestType]?.label ?? selected.requestType}
                </span>
              </div>
              {selected.requestType === "BULK" && (
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
                  {selected.company && <p><span className="font-medium">Công ty/đội nhóm:</span> {selected.company}</p>}
                  {selected.quantity && <p><span className="font-medium">Số lượng dự kiến:</span> {selected.quantity} áo</p>}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Yêu cầu</p>
                <p className="mt-1 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{selected.requirements}</p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS).map(([key, value]) => (
                    <button key={key} onClick={() => updateStatus(selected.id, key)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${selected.status === key ? value.cls + " ring-2 ring-offset-1 ring-current" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Ghi chú nội bộ</p>
                <textarea rows={3} value={selected.adminNote ?? ""} onChange={(e) => setSelected({ ...selected, adminNote: e.target.value })} placeholder="Ghi chú khi tư vấn khách..." className="input resize-none" />
                <button onClick={saveNote} disabled={saveNoteMutation.isPending} className="btn-outline mt-2 px-4 py-2 text-sm cursor-pointer">{saveNoteMutation.isPending ? "Đang lưu..." : "Lưu ghi chú"}</button>
              </div>
              <div className="border-t border-gray-100 pt-4 text-xs text-gray-400">Gửi lúc: {formatDate(selected.createdAt)}</div>
              <button onClick={() => remove(selected.id)} className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline cursor-pointer"><Trash2 className="h-4 w-4" /> Xóa yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
