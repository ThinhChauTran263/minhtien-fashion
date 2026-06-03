"use client";

import { useState } from "react";
import { CheckCircle2, Scissors, Ruler, Sparkles, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { tailoringApi } from "@/lib/api";

export default function TailoringPage() {
  const t = useTranslations("tailoring");
  const [form, setForm] = useState({ requestType: "CUSTOM", name: "", phone: "", email: "", company: "", quantity: "", requirements: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0\d{9}$/.test(form.phone)) {
      toast.error(t("phoneInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      await tailoringApi.create({
        name: form.name,
        phone: form.phone,
        requestType: form.requestType as "CUSTOM" | "BULK",
        email: form.email || undefined,
        company: form.company || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        requirements: form.requirements,
      });
      setDone(true);
      toast.success(t("success"));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: Ruler, title: t("benefit1Title"), text: t("benefit1Text") },
    { icon: Sparkles, title: t("benefit2Title"), text: t("benefit2Text") },
    { icon: Clock, title: t("benefit3Title"), text: t("benefit3Text") },
  ];

  return (
    <div className="bg-surface-secondary">
      {/* Hero */}
      <section className="border-b border-primary-100 bg-white">
        <div className="container-page py-12 md:py-16">
          <div className="flex items-center gap-2 text-accent">
            <Scissors className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">{t("overline")}</span>
          </div>
          <h1 className="mt-4 max-w-2xl text-display-md text-primary-950 md:text-display-lg">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-body-lg text-primary-600">{t("subtitle")}</p>
        </div>
      </section>

      <div className="container-page grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: benefits */}
        <div className="space-y-6">
          <h2 className="text-heading-md text-primary-950">{t("whyTitle")}</h2>
          <div className="space-y-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex gap-4 rounded-xl border border-primary-100 bg-white p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-950">{b.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-primary-600">{b.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: form */}
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card md:p-8">
          {done ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-heading-md text-primary-950">{t("thankTitle")}</h2>
              <p className="mt-2 max-w-sm text-sm text-primary-600">{t("thankText")}</p>
              <button
                type="button"
                onClick={() => { setDone(false); setForm({ requestType: "CUSTOM", name: "", phone: "", email: "", company: "", quantity: "", requirements: "" }); }}
                className="btn-outline mt-6 px-5 py-2.5 text-sm"
              >
                {t("sendAnother")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-heading-md text-primary-950">{t("formTitle")}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${form.requestType === "CUSTOM" ? "border-accent bg-accent-50" : "border-primary-100 hover:border-primary-200"}`}>
                  <input type="radio" name="requestType" value="CUSTOM" checked={form.requestType === "CUSTOM"} onChange={handleChange} className="mt-1" />
                  <span>
                    <span className="block font-semibold text-primary-950">{t("typeCustomTitle")}</span>
                    <span className="mt-1 block text-xs leading-5 text-primary-500">{t("typeCustomText")}</span>
                  </span>
                </label>
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${form.requestType === "BULK" ? "border-accent bg-accent-50" : "border-primary-100 hover:border-primary-200"}`}>
                  <input type="radio" name="requestType" value="BULK" checked={form.requestType === "BULK"} onChange={handleChange} className="mt-1" />
                  <span>
                    <span className="flex items-center gap-1.5 font-semibold text-primary-950"><Users className="h-4 w-4" /> {t("typeBulkTitle")}</span>
                    <span className="mt-1 block text-xs leading-5 text-primary-500">{t("typeBulkText")}</span>
                  </span>
                </label>
              </div>

              {form.requestType === "BULK" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-primary-700">{t("company")}</span>
                    <input name="company" value={form.company} onChange={handleChange} placeholder={t("companyPlaceholder")} className="input" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-primary-700">{t("quantity")}</span>
                    <input name="quantity" type="number" min={1} max={100000} value={form.quantity} onChange={handleChange} placeholder={t("quantityPlaceholder")} className="input" />
                  </label>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-primary-700">{t("name")} <span className="text-red-500">*</span></span>
                  <input name="name" required value={form.name} onChange={handleChange} placeholder={t("namePlaceholder")} className="input" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-primary-700">{t("phone")} <span className="text-red-500">*</span></span>
                  <input name="phone" required value={form.phone} onChange={handleChange} placeholder={t("phonePlaceholder")} className="input" inputMode="numeric" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-primary-700">{t("email")}</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={t("emailPlaceholder")} className="input" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-primary-700">{t("requirements")} <span className="text-red-500">*</span></span>
                <textarea name="requirements" required rows={5} value={form.requirements} onChange={handleChange} placeholder={t("requirementsPlaceholder")} className="input resize-none" />
              </label>
              <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
                {submitting ? t("submitting") : t("submit")}
              </button>
              <p className="text-center text-xs text-primary-400">{t("privacyNote")}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}



