"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Save, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { adminApi } from "@/lib/api";

type SettingsForm = {
  shopName: string;
  contactEmail: string;
  hotline: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  seoTitle?: string;
  seoDescription?: string;
  announcementBanner?: string;
};

const defaultValues: SettingsForm = {
  shopName: "Minh Tien Fashion",
  contactEmail: "support@minhtien.vn",
  hotline: "0900000001",
  address: "Ho Chi Minh City, Vietnam",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  freeShippingThreshold: 500000,
  defaultShippingFee: 30000,
  seoTitle: "Minh Tien Fashion - Menswear Essentials",
  seoDescription: "Premium menswear essentials with refined materials and modern fit.",
  announcementBanner: "",
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const settingsSchema = useMemo(
    () =>
      z.object({
        shopName: z.string().min(1, t("required")),
        contactEmail: z.string().email(t("invalidEmail")),
        hotline: z.string().min(1, t("required")),
        address: z.string().min(1, t("required")),
        facebookUrl: z.string().url(t("invalidUrl")).or(z.literal("")),
        instagramUrl: z.string().url(t("invalidUrl")).or(z.literal("")),
        tiktokUrl: z.string().url(t("invalidUrl")).or(z.literal("")),
        freeShippingThreshold: z.coerce.number().min(0),
        defaultShippingFee: z.coerce.number().min(0),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        announcementBanner: z.string().optional(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema), defaultValues });

  useEffect(() => {
    adminApi
      .getSettings()
      .then((res) => reset({ ...defaultValues, ...(res.data.data ?? {}) }))
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, [reset, t]);

  const onSubmit = async (values: SettingsForm) => {
    setSaving(true);
    try {
      await adminApi.updateSettings(values);
      toast.success(t("saved"));
      reset(values);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-400">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Settings className="h-6 w-6" /> {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("storeInfo")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("shopName")} error={errors.shopName?.message}><input className="input" {...register("shopName")} /></Field>
            <Field label={t("contactEmail")} error={errors.contactEmail?.message}><input className="input" type="email" {...register("contactEmail")} /></Field>
            <Field label={t("hotline")} error={errors.hotline?.message}><input className="input" {...register("hotline")} /></Field>
            <Field label={t("address")} error={errors.address?.message}><input className="input" {...register("address")} /></Field>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("social")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={t("facebookUrl")} error={errors.facebookUrl?.message}><input className="input" {...register("facebookUrl")} /></Field>
            <Field label={t("instagramUrl")} error={errors.instagramUrl?.message}><input className="input" {...register("instagramUrl")} /></Field>
            <Field label={t("tiktokUrl")} error={errors.tiktokUrl?.message}><input className="input" {...register("tiktokUrl")} /></Field>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("operations")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("freeShippingThreshold")} error={errors.freeShippingThreshold?.message}><input className="input" type="number" min={0} step={1000} {...register("freeShippingThreshold")} /></Field>
            <Field label={t("defaultShippingFee")} error={errors.defaultShippingFee?.message}><input className="input" type="number" min={0} step={1000} {...register("defaultShippingFee")} /></Field>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("seo")}</h2>
          <div className="space-y-4">
            <Field label={t("seoTitle")} error={errors.seoTitle?.message}><input className="input" {...register("seoTitle")} /></Field>
            <Field label={t("seoDescription")} error={errors.seoDescription?.message}><textarea className="input" rows={3} {...register("seoDescription")} /></Field>
            <Field label={t("announcementBanner")} error={errors.announcementBanner?.message}><textarea className="input" rows={3} placeholder={t("announcementPlaceholder")} {...register("announcementBanner")} /></Field>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}