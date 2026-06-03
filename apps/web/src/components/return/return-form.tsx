"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { returnApi, uploadApi } from "@/lib/api";

const reasonKeys = ["reasonProductDefect", "reasonWrongSize", "reasonNotAsDescribed", "reasonChangedMind", "reasonOther"] as const;

export function ReturnForm({ order, onCreated }: { order: any; onCreated?: () => void }) {
  const t = useTranslations("returnForm");
  const [type, setType] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [reasonKey, setReasonKey] = useState<string>(reasonKeys[0]);
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exchange, setExchange] = useState<Record<string, { newSize?: string; newColor?: string }>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const items = order.items
      .filter((item: any) => selected[item.id])
      .map((item: any) => ({ orderItemId: item.id, quantity: item.quantity, ...exchange[item.id] }));
    if (items.length === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }

    setSubmitting(true);
    try {
      let images: string[] = [];
      if (files.length) {
        const res = await uploadApi.uploadImages(files);
        images = res.data.data?.urls ?? res.data.data ?? [];
      }
      // Send the localized reason text so admin can read it; fall back to key.
      await returnApi.create({ orderId: order.id, type, reason: t(reasonKey as any), description, images, items });
      toast.success(t("success"));
      onCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-primary-100 bg-white p-5">
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-primary-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t("type")}</span>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded border border-primary-200 px-3 py-2">
            <option value="RETURN">{t("typeReturn")}</option>
            <option value="EXCHANGE">{t("typeExchange")}</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t("reason")}</span>
          <select value={reasonKey} onChange={(e) => setReasonKey(e.target.value)} className="w-full rounded border border-primary-200 px-3 py-2">
            {reasonKeys.map((key) => (
              <option key={key} value={key}>{t(key as any)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {order.items.map((item: any) => (
          <label key={item.id} className="block rounded border border-primary-100 p-3 text-sm">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={Boolean(selected[item.id])} onChange={(e) => setSelected((curr) => ({ ...curr, [item.id]: e.target.checked }))} className="mt-1" />
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-primary-500">{item.variantName} x{item.quantity}</p>
                {type === "EXCHANGE" && selected[item.id] && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input placeholder={t("newSize")} className="rounded border border-primary-200 px-3 py-2" onChange={(e) => setExchange((curr) => ({ ...curr, [item.id]: { ...curr[item.id], newSize: e.target.value } }))} />
                    <input placeholder={t("newColor")} className="rounded border border-primary-200 px-3 py-2" onChange={(e) => setExchange((curr) => ({ ...curr, [item.id]: { ...curr[item.id], newColor: e.target.value } }))} />
                  </div>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t("description")}</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded border border-primary-200 px-3 py-2" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t("images")}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} />
      </label>

      <button type="button" onClick={submit} disabled={submitting} className="btn-primary px-5 py-2 disabled:opacity-60">
        {submitting ? t("submitting") : t("submit")}
      </button>
    </div>
  );
}

