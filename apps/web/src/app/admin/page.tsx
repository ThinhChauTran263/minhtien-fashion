"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingCart, Clock, DollarSign } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable, type Column } from "@/components/admin/data-table";

interface DashboardData {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    pendingOrders: number;
    revenue: number;
  };
  bestSellers: Array<{ id: string; name: string; soldCount: number; thumbnail: string }>;
  recentOrders: Array<{ id: string; code: string; shippingName: string; total: number; status: string; createdAt: string }>;
}

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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.getDashboard();
        setData(res.data.data);
      } catch {
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-pulse text-gray-400">Đang tải...</div></div>;
  }

  if (error || !data) {
    return <div className="flex h-64 items-center justify-center"><p className="text-red-500">{error}</p></div>;
  }

  const orderColumns: Column<DashboardData["recentOrders"][0]>[] = [
    { key: "code", label: "Mã đơn", render: (item) => <span className="font-medium">{item.code}</span> },
    { key: "shippingName", label: "Khách hàng" },
    { key: "total", label: "Tổng tiền", render: (item) => formatPrice(Number(item.total)) },
    {
      key: "status",
      label: "Trạng thái",
      render: (item) => <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[item.status] || ""}`}>{statusLabels[item.status] || item.status}</span>,
    },
    { key: "createdAt", label: "Ngày tạo", render: (item) => formatDate(item.createdAt) },
  ];

  const bestSellerColumns: Column<DashboardData["bestSellers"][0]>[] = [
    { key: "thumbnail", label: "Ảnh", render: (item) => <img src={item.thumbnail} alt={item.name} className="h-10 w-10 rounded object-cover" />, className: "w-14" },
    { key: "name", label: "Tên sản phẩm" },
    { key: "soldCount", label: "Đã bán", render: (item) => <span className="font-medium">{item.soldCount}</span> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng sản phẩm" value={data.stats.totalProducts} icon={Package} />
        <StatCard title="Tổng đơn hàng" value={data.stats.totalOrders} icon={ShoppingCart} />
        <StatCard title="Đơn chờ xử lý" value={data.stats.pendingOrders} icon={Clock} />
        <StatCard title="Doanh thu" value={formatPrice(data.stats.revenue)} icon={DollarSign} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
          <DataTable columns={orderColumns} data={data.recentOrders.slice(0, 5)} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Sản phẩm bán chạy</h2>
          <DataTable columns={bestSellerColumns} data={data.bestSellers} />
        </div>
      </div>
    </div>
  );
}