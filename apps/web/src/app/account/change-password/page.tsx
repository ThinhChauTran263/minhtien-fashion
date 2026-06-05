"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { userApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export default function ChangePasswordPage() {
  const t = useTranslations("account");
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const passwordMutation = useMutation({
    mutationFn: (payload: any) => userApi.changePassword(payload),
    onSuccess: () => {
      toast.success(t("passwordUpdateSuccess"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("passwordUpdateError"));
    }
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.newPassword.length < 6) return toast.error(t("passwordMin"));
    if (form.newPassword !== form.confirmPassword) return toast.error(t("passwordMismatch"));
    
    passwordMutation.mutate({ 
      currentPassword: form.currentPassword, 
      newPassword: form.newPassword 
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("passwordTitle")}</h1>
      <form onSubmit={submit} className="max-w-xl rounded-lg border border-primary-100 bg-white p-6">
        <div className="space-y-4">
          <input
            type="password"
            required
            placeholder={t("passwordCurrent")}
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            className="input"
          />
          <input
            type="password"
            required
            placeholder={t("passwordNew")}
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            className="input"
          />
          <input
            type="password"
            required
            placeholder={t("passwordConfirm")}
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            className="input"
          />
        </div>
        <button disabled={passwordMutation.isPending} className="btn-primary mt-6 w-full">
          {passwordMutation.isPending ? t("passwordSaving") : t("passwordSubmit")}
        </button>
      </form>
    </div>
  );
}
