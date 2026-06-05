"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

const statuses = ["", "PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "COMPLETED"];
const labels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  RECEIVED: "Đã nhận hàng",
  REFUNDED: "Đã hoàn tiền",
  COMPLETED: "Hoàn tất",
};

export default function AdminReturnsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [qcGrades, setQcGrades] = useState<Record<string, string>>({});

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["admin", "returns", { status }],
    queryFn: async () => {
      const res = await adminApi.getReturns(status ? { status } : undefined);
      return res.data.data || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const selectReturn = (item: any) => {
    setSelected(item);
    const initialGrades: Record<string, string> = {};
    item.items?.forEach((i: any) => {
      const effectiveId = i.orderItemId || item.order?.items?.find((o: any) => o.productSlug === i.orderItemProductSlug)?.id || i.orderItemProductSlug;
      initialGrades[effectiveId] = "A"; // Mặc định là Grade A
    });
    setQcGrades(initialGrades);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus, gradesPayload }: { id: string; nextStatus: string; gradesPayload: any }) => 
      adminApi.updateReturn(id, {
        status: nextStatus,
        adminNote,
        qcGrades: gradesPayload
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật yêu cầu");
      setSelected(null);
      setAdminNote("");
      setQcGrades({});
      queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
    },
    onError: () => {
      toast.error("Không cập nhật được yêu cầu");
    }
  });

  const updateStatus = (id: string, nextStatus: string) => {
    let gradesPayload = undefined;
    if (nextStatus === "REFUNDED" || nextStatus === "COMPLETED") {
      gradesPayload = selected.items?.map((item: any) => {
        const orderItem = selected.order?.items?.find((o: any) => o.id === item.orderItemId || (item.orderItemProductSlug && o.productSlug === item.orderItemProductSlug));
        const effectiveItemId = item.orderItemId || orderItem?.id;
        return {
          orderItemId: effectiveItemId,
          variantId: orderItem?.variantId,
          quantity: item.quantity,
          grade: qcGrades[effectiveItemId] || "A",
          note: "Kiểm định từ giao diện admin",
        };
      });
    }

    updateStatusMutation.mutate({ id, nextStatus, gradesPayload });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đổi trả</h1>
        <p className="mt-1 text-sm text-gray-500">Duyệt, từ chối, đánh dấu đã nhận hàng và hoàn tiền.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button key={item || "all"} onClick={() => setStatus(item)} className={`rounded px-3 py-2 text-sm cursor-pointer ${status === item ? "bg-primary-800 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {item ? labels[item] : "Tất cả"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                {["Mã", "Khách", "Đơn", "Loại", "Lý do", "Status", "Ngày", ""].map((head) => <th key={head} className="p-3 font-semibold">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {returns.map((item: any) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{item.code}</td>
                  <td className="p-3">{item.user?.name}<br /><span className="text-xs text-gray-500">{item.user?.email}</span></td>
                  <td className="p-3">{item.order?.code}</td>
                  <td className="p-3">{item.type === "RETURN" ? "Trả" : "Đổi"}</td>
                  <td className="p-3">{item.reason}</td>
                  <td className="p-3"><span className="rounded bg-gray-100 px-2 py-1 text-xs">{labels[item.status] ?? item.status}</span></td>
                  <td className="p-3 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="p-3"><button onClick={() => selectReturn(item)} className="text-primary-800 hover:underline cursor-pointer">Chi tiết</button></td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Không có yêu cầu đổi trả nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{selected.code}</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-gray-500">Khách:</span> {selected.user?.name}</p>
              <p><span className="text-gray-500">Đơn:</span> {selected.order?.code}</p>
              <p><span className="text-gray-500">Loại:</span> {selected.type === "RETURN" ? "Trả hàng" : "Đổi hàng"}</p>
              <p><span className="text-gray-500">Hoàn tiền:</span> {selected.refundAmount ? formatPrice(Number(selected.refundAmount)) : "-"}</p>
              <p className="md:col-span-2"><span className="text-gray-500">Lý do:</span> {selected.reason}</p>
              <p className="md:col-span-2"><span className="text-gray-500">Mô tả:</span> {selected.description || "-"}</p>
            </div>

            {selected.items && selected.items.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Sản phẩm yêu cầu đổi trả</h3>
                <div className="space-y-2">
                  {selected.items.map((item: any) => {
                    const orderItem = selected.order?.items?.find((o: any) => o.id === item.orderItemId || (item.orderItemProductSlug && o.productSlug === item.orderItemProductSlug));
                    const effectiveItemId = item.orderItemId || orderItem?.id || item.orderItemProductSlug;
                    return (
                      <div key={effectiveItemId} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2 text-xs">
                        {orderItem?.image && (
                          <img src={orderItem.image} alt={orderItem.productName} className="h-12 w-12 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{orderItem?.productName || "Sản phẩm không rõ"}</p>
                          <p className="text-gray-500">
                            Phân loại: {orderItem?.variantName} | Số lượng: <span className="font-semibold text-gray-900">{item.quantity}</span>
                          </p>
                          {selected.type === "EXCHANGE" && (item.newSize || item.newColor) && (
                            <p className="text-primary-800 font-medium mt-0.5">
                              Đổi sang: {item.newSize ? `Size ${item.newSize}` : ""} {item.newColor ? `Màu ${item.newColor}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[150px]">
                          <p className="font-medium text-gray-900">{orderItem?.price ? formatPrice(Number(orderItem.price)) : "-"}</p>
                          
                          {!selected.stockProcessed && (
                            <select
                              value={qcGrades[effectiveItemId] || "A"}
                              onChange={(e) => setQcGrades({ ...qcGrades, [effectiveItemId]: e.target.value })}
                              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none w-full"
                            >
                              <option value="A">Nhập kho bán (A)</option>
                              <option value="B">Nhập kho Outlet (B)</option>
                              <option value="C">Tiêu hủy/Lỗi hỏng (C)</option>
                            </select>
                          )}

                          {selected.stockProcessed && selected.qcResults && (
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Đã QC: Grade {(() => {
                                const qcItem = (selected.qcResults as any[])?.find((q: any) => q.orderItemId === effectiveItemId);
                                return qcItem?.grade || "Chưa rõ";
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selected.images?.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{selected.images.map((img: string) => <img key={img} src={img} alt="Return" className="h-20 w-20 rounded object-cover" />)}</div>}
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Ghi chú admin" className="mt-4 min-h-24 w-full rounded border border-gray-200 px-3 py-2 text-sm" />
            <div className="mt-4 flex flex-wrap gap-2">
              {["APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "COMPLETED"].map((next) => (
                <button key={next} onClick={() => updateStatus(selected.id, next)} disabled={updateStatusMutation.isPending} className="rounded bg-primary-800 px-3 py-2 text-sm text-white cursor-pointer disabled:opacity-60 hover:bg-primary-900 transition-colors">
                  {labels[next]}
                </button>
              ))}
              <button onClick={() => setSelected(null)} className="rounded border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

