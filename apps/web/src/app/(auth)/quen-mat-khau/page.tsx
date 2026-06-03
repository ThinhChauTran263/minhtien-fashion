"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t("genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-100 shadow-sm p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-800 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToLogin")}
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t("forgotSent")}</h1>
            <p
              className="mt-2 text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: t("forgotSentText", { email }) }}
            />
            <Link href="/login" className="mt-6 btn-primary inline-block cursor-pointer">
              {t("forgotBackHome")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">{t("forgotTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("forgotText")}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tCommon("email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder={t("emailPlaceholder")}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full cursor-pointer"
              >
                {submitting ? tCommon("submitting") : t("forgotSubmit")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

