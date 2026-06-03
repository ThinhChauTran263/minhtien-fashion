"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface BlogFormProps {
  postId?: string;
}

export function BlogForm({ postId }: BlogFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    thumbnail: "",
    categoryId: "",
    tags: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
  });

  useEffect(() => {
    api.get("/blog/categories").then(({ data }) => {
      setCategories(data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!postId) return;
    api.get("/admin/blog/posts", { params: { limit: 100 } })
      .then(({ data }) => {
        const post = data.data.items.find((p: any) => p.id === postId);
        if (post) {
          setForm({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            thumbnail: post.thumbnail,
            categoryId: post.categoryId,
            tags: (post.tags || []).join(", "),
            metaTitle: post.metaTitle || "",
            metaDescription: post.metaDescription || "",
            isPublished: post.isPublished,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (postId) {
        await api.patch(`/admin/blog/posts/${postId}`, payload);
      } else {
        await api.post("/admin/blog/posts", payload);
      }
      toast.success(postId ? "Đã cập nhật" : "Đã tạo bài viết");
      router.push("/admin/blog");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 rounded-md hover:bg-gray-200 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{postId ? "Sửa bài viết" : "Viết bài mới"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn *</label>
          <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input" required>
              <option value="">-- Chọn --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (phẩy)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input" placeholder="polo, phoi do" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL *</label>
          <input type="url" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung (Markdown) *</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={14} className="input resize-y font-mono text-sm" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta title</label>
            <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
            <input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="input" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-700">Xuất bản</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">
            {submitting ? "Đang lưu..." : postId ? "Cập nhật" : "Tạo bài"}
          </button>
          <Link href="/admin/blog" className="btn-outline cursor-pointer">Huỷ</Link>
        </div>
      </form>
    </div>
  );
}

