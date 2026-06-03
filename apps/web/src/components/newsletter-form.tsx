"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { newsletterApi } from "@/lib/api";

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await newsletterApi.subscribe(email);
      setDone(true);
      toast.success(t("success"));
      setEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 rounded-badge bg-success-light px-4 py-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="flex w-full max-w-md flex-col gap-2 sm:flex-row md:ml-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("placeholder")}
          className="input pl-10"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary whitespace-nowrap !py-3">
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

