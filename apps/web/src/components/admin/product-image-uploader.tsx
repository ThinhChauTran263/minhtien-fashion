"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadApi } from "@/lib/api";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

export function ProductImageUploader({ images, onChange, error }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;

    setUploading(true);
    try {
      const res = await uploadApi.uploadImages(selected);
      const urls = res.data.data?.urls ?? [];
      onChange([...images, ...urls]);
      toast.success("Đã tải ảnh lên Cloudinary");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Không tải được ảnh lên Cloudinary");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Hình ảnh</h2>
        <p className="mt-1 text-sm text-gray-500">
          Chọn ảnh từ máy để tải lên Cloudinary. Ảnh đầu tiên sẽ là thumbnail.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary-300 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-900 transition-colors hover:bg-primary-100 disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
      </button>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <div className="aspect-square">
                <img src={url} alt={`Ảnh sản phẩm ${index + 1}`} className="h-full w-full object-cover" />
              </div>
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-primary-900 px-2 py-0.5 text-xs font-medium text-white">
                  Thumbnail
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded bg-white/90 p-1.5 text-red-600 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
