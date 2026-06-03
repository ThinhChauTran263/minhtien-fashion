"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await authApi.login(form);
      const user = data.data.user;
      setAuth(user);
      const nextUrl = searchParams.get("next");
      const safeNextUrl = nextUrl?.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : null;
      router.replace(safeNextUrl ?? (user.role === "ADMIN" ? "/admin" : "/"));
    } catch (err: any) {
      const message = err.response?.data?.error || t("loginFailed");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <h1 className="text-2xl font-bold text-center mb-8">{t("loginTitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>
          )}

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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">{t("passwordLabel")}</label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder={t("passwordPlaceholder")}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? tCommon("processing") : t("loginSubmit")}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">{tCommon("or")}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-primary-500 mt-6">
          {t("loginNoAccount")}{" "}
          <Link href="/register" className="text-accent hover:underline">
            {t("loginRegisterLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

