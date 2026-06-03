"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { adminApi, categoryApi } from "@/lib/api";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]),
  color: z.string().min(1, "Nhập tên màu"),
  colorHex: z.string().min(4, "Chọn mã màu"),
  stock: z.coerce.number().int().min(0, "Tồn kho >= 0"),
});

const productFormSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm tối thiểu 2 ký tự"),
  description: z.string().min(1, "Nhập mô tả"),
  shortDesc: z.string().optional(),
  categoryId: z.string().min(1, "Chọn danh mục"),
  collarType: z.enum(["CO_CO", "CO_TRON"]),
  material: z.string().optional(),
  basePrice: z.coerce.number().int().min(1, "Nhập giá gốc"),
  salePrice: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string().url("URL ảnh không hợp lệ")).min(1, "Thêm ít nhất 1 ảnh"),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "Thêm ít nhất 1 biến thể"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      collarType: "CO_TRON",
      isFeatured: false,
      images: [],
      variants: [{ size: "M", color: "", colorHex: "#000000", stock: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.getProduct(params.id)
      .then(({ data }) => {
        if (cancelled) return;
        const product = data.data;
        const nextImages = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
        setImages(nextImages);
        reset({
          name: product.name ?? "",
          description: product.description ?? "",
          shortDesc: product.shortDesc ?? "",
          categoryId: product.categoryId ?? "",
          collarType: product.collarType ?? "CO_TRON",
          material: product.material ?? "",
          basePrice: Number(product.basePrice ?? 0),
          salePrice: product.salePrice ? Number(product.salePrice) : undefined,
          images: nextImages,
          isFeatured: Boolean(product.isFeatured),
          variants: (product.variants ?? []).map((variant: any) => ({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            stock: Number(variant.stock ?? 0),
          })),
        });
        replace((product.variants ?? []).map((variant: any) => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          stock: Number(variant.stock ?? 0),
        })));
      })
      .catch(() => setError("Không tải được sản phẩm"))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [params.id, replace, reset]);

  useEffect(() => {
    setValue("images", images, { shouldValidate: true });
  }, [images, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    setError("");
    try {
      await adminApi.updateProduct(params.id, {
        ...data,
        thumbnail: data.images[0] || "",
        tags: [],
        salePrice: data.salePrice || undefined,
      });
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra khi cập nhật sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Đang tải sản phẩm...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="rounded-md p-2 transition-colors hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Sửa sản phẩm</h1>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Tên sản phẩm *</label><input {...register("name")} className="input" />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}</div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Mô tả *</label><textarea {...register("description")} rows={4} className="input resize-none" />{errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}</div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Mô tả ngắn</label><input {...register("shortDesc")} className="input" /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Danh mục *</label><select {...register("categoryId")} className="input"><option value="">-- Chọn danh mục --</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>{errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Loại cổ *</label><select {...register("collarType")} className="input"><option value="CO_TRON">Cổ tròn</option><option value="CO_CO">Cổ có (Polo)</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Chất liệu</label><input {...register("material")} className="input" /></div>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Giá bán</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Giá gốc (VNĐ) *</label><input {...register("basePrice")} type="number" className="input" />{errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Giá sale (VNĐ)</label><input {...register("salePrice")} type="number" className="input" /></div>
          </div>
          <label className="flex cursor-pointer items-center gap-2"><input {...register("isFeatured")} type="checkbox" className="h-4 w-4 rounded border-gray-300" /><span className="text-sm text-gray-700">Sản phẩm nổi bật</span></label>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <ProductImageUploader images={images} onChange={setImages} error={errors.images?.message} />
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Biến thể</h2><button type="button" onClick={() => append({ size: "M", color: "", colorHex: "#000000", stock: 0 })} className="flex items-center gap-1 text-sm text-primary-800 hover:underline"><Plus className="h-4 w-4" /> Thêm biến thể</button></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200"><th className="px-2 py-2 text-left font-medium text-gray-600">Size</th><th className="px-2 py-2 text-left font-medium text-gray-600">Màu</th><th className="px-2 py-2 text-left font-medium text-gray-600">Mã màu</th><th className="px-2 py-2 text-left font-medium text-gray-600">Tồn kho</th><th className="w-10" /></tr></thead><tbody>{fields.map((field, idx) => (<tr key={field.id} className="border-b border-gray-100"><td className="px-2 py-2"><select {...register(`variants.${idx}.size`)} className="input py-1.5 text-sm">{["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => <option key={size} value={size}>{size}</option>)}</select></td><td className="px-2 py-2"><input {...register(`variants.${idx}.color`)} className="input py-1.5 text-sm" /></td><td className="px-2 py-2"><input {...register(`variants.${idx}.colorHex`)} type="color" className="h-8 w-10 cursor-pointer rounded border border-gray-200" /></td><td className="px-2 py-2"><input {...register(`variants.${idx}.stock`)} type="number" className="input w-20 py-1.5 text-sm" /></td><td className="px-2 py-2">{fields.length > 1 && <button type="button" onClick={() => remove(idx)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</td></tr>))}</tbody></table></div>
          {errors.variants && <p className="text-xs text-red-500">{typeof errors.variants.message === "string" ? errors.variants.message : "Kiểm tra lại biến thể"}</p>}
        </div>

        <div className="flex items-center gap-3"><button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Đang lưu..." : "Lưu sản phẩm"}</button><Link href="/admin/products" className="btn-outline">Hủy</Link></div>
      </form>
    </div>
  );
}
