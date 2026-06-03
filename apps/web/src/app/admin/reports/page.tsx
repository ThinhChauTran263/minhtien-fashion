"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Download, Loader2, TrendingUp, ShoppingBag, Users, DollarSign } from "lucide-react";
import { adminApi, api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const ReferenceLine = dynamic(() => import("recharts").then((m) => m.ReferenceLine), { ssr: false });

const COLORS = ["#1A1A1A", "#4B5563", "#9CA3AF", "#D1D5DB", "#F3F4F6"];
const PROJECT_START_YEAR = 2026;

function toIso(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

type ViewMode = "7days" | "30days" | "month" | "quarter" | "year" | "allYears";

/**
 * Fill revenue data to create complete X-axis (no gaps).
 * Fills missing dates/months/years with revenue=0.
 */
function fillChartData(
  rawData: Array<{ date: string; revenue: number; count: number }>,
  mode: ViewMode
): Array<{ label: string; revenue: number; count: number; quarter?: string }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const revenueMap = new Map(rawData.map((r) => [r.date, r]));

  if (mode === "7days" || mode === "30days" || mode === "month") {
    // Generate all days in range
    let startDate: Date;
    let endDate = now;
    if (mode === "7days") {
      startDate = new Date(Date.now() - 6 * 86400000);
    } else if (mode === "30days") {
      startDate = new Date(Date.now() - 29 * 86400000);
    } else {
      // month: all days of current month
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month, daysInMonth(year, month));
    }

    const result: Array<{ label: string; revenue: number; count: number }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = toIso(cursor);
      const day = cursor.getDate();
      const m = cursor.getMonth() + 1;
      const entry = revenueMap.get(key);
      result.push({
        label: `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
        revenue: entry?.revenue ?? 0,
        count: entry?.count ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  if (mode === "quarter") {
    // 4 quarters × 3 months = 12 columns, grouped by quarter
    const result: Array<{ label: string; revenue: number; count: number; quarter: string }> = [];
    for (let q = 0; q < 4; q++) {
      for (let m = 0; m < 3; m++) {
        const monthIdx = q * 3 + m;
        const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
        const entry = revenueMap.get(key);
        result.push({
          label: `T${monthIdx + 1}`,
          revenue: entry?.revenue ?? 0,
          count: entry?.count ?? 0,
          quarter: `Quý ${q + 1}`,
        });
      }
    }
    return result;
  }

  if (mode === "year") {
    // 12 months of current year
    const result: Array<{ label: string; revenue: number; count: number }> = [];
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, "0")}`;
      const entry = revenueMap.get(key);
      result.push({
        label: `T${m + 1}`,
        revenue: entry?.revenue ?? 0,
        count: entry?.count ?? 0,
      });
    }
    return result;
  }

  if (mode === "allYears") {
    // 10 years from project start
    const result: Array<{ label: string; revenue: number; count: number }> = [];
    for (let y = PROJECT_START_YEAR; y < PROJECT_START_YEAR + 10; y++) {
      const key = String(y);
      const entry = revenueMap.get(key);
      result.push({
        label: String(y),
        revenue: entry?.revenue ?? 0,
        count: entry?.count ?? 0,
      });
    }
    return result;
  }

  return [];
}

/** Map viewMode to API groupBy parameter */
function getApiGroupBy(mode: ViewMode): "day" | "month" | "year" {
  switch (mode) {
    case "7days":
    case "30days":
    case "month":
      return "day";
    case "quarter":
    case "year":
      return "month";
    case "allYears":
      return "year";
  }
}

/** Get date range for API call */
function getDateRange(mode: ViewMode): [string, string] {
  const now = new Date();
  const year = now.getFullYear();
  switch (mode) {
    case "7days":
      return [toIso(new Date(Date.now() - 6 * 86400000)), toIso(now)];
    case "30days":
      return [toIso(new Date(Date.now() - 29 * 86400000)), toIso(now)];
    case "month":
      return [toIso(new Date(year, now.getMonth(), 1)), toIso(new Date(year, now.getMonth(), daysInMonth(year, now.getMonth())))];
    case "quarter":
    case "year":
      return [`${year}-01-01`, `${year}-12-31`];
    case "allYears":
      return [`${PROJECT_START_YEAR}-01-01`, `${PROJECT_START_YEAR + 9}-12-31`];
  }
}

function getChartTitle(mode: ViewMode): string {
  switch (mode) {
    case "7days": return "Doanh thu 7 ngày qua";
    case "30days": return "Doanh thu 30 ngày qua";
    case "month": return "Doanh thu theo ngày (tháng này)";
    case "quarter": return "Doanh thu theo quý (năm nay)";
    case "year": return "Doanh thu theo tháng (năm nay)";
    case "allYears": return "Doanh thu hằng năm (2026 – 2035)";
  }
}

export default function AdminReportsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    summary: { revenue: number; paidCount: number; totalOrders: number; newCustomers: number; aov: number };
    revenue: Array<{ date: string; revenue: number; count: number }>;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [from, to] = getDateRange(viewMode);
      const groupBy = getApiGroupBy(viewMode);
      const res = await adminApi.getReportSummary(from, to, groupBy);
      setData(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return fillChartData(data.revenue, viewMode);
  }, [data, viewMode]);

  // Quarter reference lines (vertical dividers between Q1/Q2/Q3/Q4)
  const quarterLines = viewMode === "quarter"
    ? [3, 6, 9].map((i) => chartData[i]?.label).filter(Boolean)
    : [];

  const exportFile = async (type: "revenue" | "orders" | "products") => {
    try {
      const [from, to] = getDateRange(viewMode);
      const res = await api.get(`/admin/reports/${type}/export`, {
        params: { from, to },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-${type}-${from}-${to}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Export]", err);
    }
  };

  const presets: Array<{ label: string; mode: ViewMode }> = [
    { label: "7 ngày qua", mode: "7days" },
    { label: "30 ngày qua", mode: "30days" },
    { label: "Tháng này", mode: "month" },
    { label: "Quý này", mode: "quarter" },
    { label: "Năm nay", mode: "year" },
    { label: "Hằng năm", mode: "allYears" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.mode}
            onClick={() => setViewMode(p.mode)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
              viewMode === p.mode
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Doanh thu" value={formatPrice(data.summary.revenue)} icon={DollarSign} />
            <StatCard title="Đơn đã TT" value={data.summary.paidCount} icon={ShoppingBag} />
            <StatCard title="Giá trị TB / đơn" value={formatPrice(Math.round(data.summary.aov))} icon={TrendingUp} />
            <StatCard title="Khách mới" value={data.summary.newCustomers} icon={Users} />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">{getChartTitle(viewMode)}</h2>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">Chưa có dữ liệu doanh thu</p>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: viewMode === "quarter" ? 30 : 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    interval={viewMode === "30days" ? 2 : 0}
                    angle={chartData.length > 15 ? -45 : 0}
                    textAnchor={chartData.length > 15 ? "end" : "middle"}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => {
                      if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                      return String(v);
                    }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatPrice(Number(v)), "Doanh thu"]}
                    labelClassName="font-medium text-gray-900 mb-1"
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  {/* Quarter divider lines */}
                  {quarterLines.map((label) => (
                    <ReferenceLine key={label} x={label} stroke="#e5e7eb" strokeDasharray="4 4" />
                  ))}
                  <Bar dataKey="revenue" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={viewMode === "allYears" ? 60 : 40} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {/* Quarter labels below chart */}
            {viewMode === "quarter" && (
              <div className="grid grid-cols-4 mt-2 border-t border-gray-100 pt-3">
                {["Quý 1", "Quý 2", "Quý 3", "Quý 4"].map((q) => (
                  <p key={q} className="text-center text-xs font-semibold text-gray-500">{q}</p>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1">
              <h2 className="text-lg font-semibold mb-6 text-center">Tỷ trọng doanh thu Top 5</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 py-12 text-center">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.topProducts.slice(0, 5)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="revenue" nameKey="name">
                      {data.topProducts.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(Number(value ?? 0))} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px", marginTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Top 10 sản phẩm bán chạy</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">#</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Tên sản phẩm</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-600">Đã bán</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-600">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Chưa có dữ liệu</td></tr>
                    ) : (
                      data.topProducts.map((p, i) => (
                        <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                          <td className="px-6 py-3 text-right font-medium">{p.quantity}</td>
                          <td className="px-6 py-3 text-right text-green-700 font-medium">{formatPrice(p.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportFile("revenue")} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Xuất doanh thu
            </button>
            <button onClick={() => exportFile("orders")} className="btn-outline inline-flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Xuất đơn hàng
            </button>
            <button onClick={() => exportFile("products")} className="btn-outline inline-flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Xuất SP bán chạy
            </button>
          </div>
        </>
      )}
    </div>
  );
}
