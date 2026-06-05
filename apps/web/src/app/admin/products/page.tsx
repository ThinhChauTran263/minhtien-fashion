"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  thumbnail: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  category: { name: string } | null;
  variants: Array<{ stock: number }>;
}

export default function AdminProductsPage() {
  const t = useTranslations("admin.products");
  const tAdmin = useTranslations("admin");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch products with React Query
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", { page, search }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.q = search;
      const res = await adminApi.getProducts(params);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // Cache for 1 minute to avoid re-fetching on immediate back navigation
  });

  const products = data?.items || [];
  const totalPages = data?.totalPages || 1;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };

  const columns: Column<Product>[] = [
    {
      key: "thumbnail",
      label: t("image"),
      className: "w-16",
      render: (item) => <img src={item.thumbnail} alt={item.name} className="w-12 h-12 rounded object-cover" />,
    },
    {
      key: "name",
      label: t("name"),
      render: (item) => <span className="font-medium text-gray-900 line-clamp-1">{item.name}</span>,
    },
    {
      key: "category",
      label: t("category"),
      render: (item) => item.category?.name || t("noCategory"),
    },
    {
      key: "basePrice",
      label: t("price"),
      render: (item) => (
        <div>
          {item.salePrice ? (
            <>
              <span className="text-red-600 font-medium">{formatPrice(Number(item.salePrice))}</span>
              <span className="block text-xs text-gray-400 line-through">{formatPrice(Number(item.basePrice))}</span>
            </>
          ) : (
            <span className="font-medium">{formatPrice(Number(item.basePrice))}</span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      label: t("stock"),
      render: (item) => {
        const total = item.variants.reduce((sum, variant) => sum + variant.stock, 0);
        return <span className={total === 0 ? "text-red-500 font-medium" : ""}>{total}</span>;
      },
    },
    {
      key: "isActive",
      label: t("status"),
      render: (item) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {item.isActive ? t("active") : t("hidden")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/products/${item.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-800 transition-colors cursor-pointer">
            <Pencil className="w-4 h-4" />
          </Link>
          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary inline-flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          {t("addProduct")}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("searchPlaceholder")} className="input pl-10" />
        </div>
        <button type="submit" className="btn-primary px-4 py-2 cursor-pointer">
          {t("search")}
        </button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-gray-400">{tAdmin("loading")}</div>
        </div>
      ) : (
        <DataTable columns={columns} data={products} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={t("noProducts")} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t("deleteTitle")}
        message={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
