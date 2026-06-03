"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";
import { reviewApi } from "@/lib/api";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      toast.error(t("minLength"));
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create({
        productId,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      toast.success(t("thankYou"));
      setTitle("");
      setContent("");
      setRating(5);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-primary-50 rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-primary-800">{t("formTitle")}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("ratingLabel")}</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("titleLabel")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder={t("titlePlaceholder")}
          maxLength={120}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("contentLabel")}</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          minLength={5}
          maxLength={2000}
          className="input resize-none"
          placeholder={t("contentPlaceholder")}
        />
        <p className="mt-1 text-xs text-gray-400">{content.length}/2000</p>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary cursor-pointer">
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

