"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await authApi.register(form);
      setAuth(data.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || t("registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <h1 className="text-2xl font-bold text-center mb-8">{t("registerTitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{tCommon("name")}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tCommon("email")}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("passwordLabel")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder={t("passwordMinHint")}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? tCommon("processing") : t("registerSubmit")}
          </button>
        </form>

        <p className="text-center text-sm text-primary-500 mt-6">
          {t("registerHasAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("registerLoginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

