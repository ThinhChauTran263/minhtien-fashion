"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { authApi } from "@/lib/api";

function ResetPasswordContent() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("resetInvalidToken"));
      return;
    }
    if (password.length < 6) {
      setError(t("resetMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("resetMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/dang-nhap"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t("resetTokenExpired"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-100 shadow-sm p-8">
        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t("resetSuccessTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("resetSuccessText")}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">{t("resetTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("resetText")}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("resetNewPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder={t("resetNewPasswordPlaceholder")}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("resetConfirm")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder={t("resetConfirmPlaceholder")}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !token}
                className="btn-primary w-full cursor-pointer"
              >
                {submitting ? tCommon("processing") : t("resetSubmit")}
              </button>

              <Link
                href="/dang-nhap"
                className="block text-center text-sm text-gray-500 hover:text-primary-800 cursor-pointer"
              >
                {t("backToLogin")}
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
