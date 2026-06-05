"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/admin/data-table";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  code: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

const statusTabs = [
  { key: "", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "CANCELLED", label: "Đã huỷ" },
];

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentLabels: Record<string, string> = {
  COD: "COD",
  VNPAY: "VNPay",
  MOMO: "MoMo",
  BANK_TRANSFER: "Chuyển khoản",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Chưa TT",
  PAID: "Đã TT",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", { page, statusFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getOrders(params);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const orders = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      adminApi.updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const columns: Column<Order>[] = [
    {
      key: "code",
      label: "Mã đơn",
      render: (item) => (
        <button
          onClick={() => setSelectedOrder(item)}
          className="font-medium text-primary-800 hover:underline cursor-pointer"
        >
          {item.code}
        </button>
      ),
    },
    { key: "shippingName", label: "Khách hàng" },
    { key: "shippingPhone", label: "SĐT" },
    {
      key: "total",
      label: "Tổng tiền",
      render: (item) => <span className="font-medium">{formatPrice(Number(item.total))}</span>,
    },
    {
      key: "paymentMethod",
      label: "Thanh toán",
      render: (item) => (
        <div className="text-xs">
          <div>{paymentLabels[item.paymentMethod] || item.paymentMethod}</div>
          <span className={cn(
            "inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs",
            item.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          )}>
            {paymentStatusLabels[item.paymentStatus] || item.paymentStatus}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[item.status] || ""}`}>
          {statusLabels[item.status] || item.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Ngày",
      render: (item) => <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "",
      className: "w-36",
      render: (item) => {
        const available = nextStatuses[item.status] || [];
        if (available.length === 0) return null;
        const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === item.id;
        
        return (
          <div className="relative">
            <select
              disabled={isUpdating}
              onChange={(e) => {
                if (e.target.value) handleStatusChange(item.id, e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="text-xs border border-gray-200 rounded px-2 py-1 cursor-pointer bg-white"
            >
              <option value="" disabled>Đổi TT</option>
              {available.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer",
              statusFilter === tab.key
                ? "bg-primary-800 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="Không có đơn hàng nào"
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Đơn hàng #{selectedOrder.code}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.shippingName}</p>
                </div>
                <div>
                  <p className="text-gray-500">SĐT</p>
                  <p className="font-medium">{selectedOrder.shippingPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Địa chỉ</p>
                  <p className="font-medium">{selectedOrder.shippingAddress}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trạng thái</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Tổng tiền</p>
                  <p className="font-bold text-lg">{formatPrice(Number(selectedOrder.total))}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sản phẩm</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={item.image} alt={item.productName} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantName} × {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(Number(item.subtotal))}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

