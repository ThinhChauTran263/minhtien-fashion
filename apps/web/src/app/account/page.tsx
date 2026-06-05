"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, Package, Truck, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { orderApi, uploadApi, userApi } from "@/lib/api";
import { formatDate } from "@/lib/customer-utils";
import { useAuthStore } from "@/stores/auth-store";

interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  createdAt: string;
}

export default function AccountPage() {
  const t = useTranslations("account");
  const setUser = useAuthStore((state) => state.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", phone: "", avatar: "" });

  const { data, refetch } = useQuery({
    queryKey: ["account", "profile-overview"],
    queryFn: async () => {
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        userApi.getProfile(),
        orderApi.getAll(),
        userApi.getWishlist(),
      ]);
      const orders = ordersRes.data.data ?? [];
      return {
        profile: profileRes.data.data as Profile,
        stats: {
          orders: orders.length,
          shipping: orders.filter((o: any) =>
            ["CONFIRMED", "PROCESSING", "SHIPPING"].includes(o.status)
          ).length,
          wishlist: (wishlistRes.data.data ?? []).length,
        },
      };
    },
    staleTime: 60_000,
  });

  const profile = data?.profile;
  const stats = data?.stats ?? { orders: 0, shipping: 0, wishlist: 0 };

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      avatar: profile.avatar ?? "",
    });
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: (payload: any) => userApi.updateProfile(payload),
    onSuccess: (res) => {
      setUser(res.data.data);
      refetch();
      toast.success(t("profileUpdateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("profileUpdateError"));
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadPublicImage(file),
    onSuccess: (res) => {
      setForm((current) => ({ ...current, avatar: res.data.data.url }));
      toast.success(t("avatarUploadSuccess"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("avatarUploadError"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("profileNameRequired"));
      return;
    }

    profileMutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      avatar: form.avatar.trim() || null,
    });
  };

  const uploadAvatar = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("avatarInvalidType"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t("avatarTooLarge"));
      return;
    }
    uploadMutation.mutate(file);
  };

  const avatarPreview = form.avatar.trim();
  const saving = profileMutation.isPending;
  const uploading = uploadMutation.isPending;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("profileTitle")}</h1>
      <div className="rounded-lg border border-primary-100 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-800 text-xl font-bold text-white">
            {avatarPreview ? (
              <img src={avatarPreview} alt={form.name || t("profileAvatarAlt")} className="h-full w-full object-cover" />
            ) : (
              profile?.name?.charAt(0).toUpperCase() ?? "M"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{profile?.name ?? "..."}</p>
            <p className="truncate text-sm text-primary-400">{profile?.email ?? "..."}</p>
          </div>
        </div>

        <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-primary-800">
              {t("labelName")}
            </label>
            <input
              id="profile-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="input"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium text-primary-800">
              {t("labelPhone")}
            </label>
            <input
              id="profile-phone"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="input"
              placeholder="0901234567"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="profile-avatar" className="mb-1 block text-sm font-medium text-primary-800">
              {t("labelAvatar")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="profile-avatar"
                value={form.avatar}
                onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
                className="input flex-1"
                placeholder="https://..."
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => uploadAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading ? t("avatarUploading") : t("avatarUpload")}
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, avatar: "" }))}
                disabled={uploading || saving || !form.avatar}
                className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                {t("avatarRemove")}
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving || uploading} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
              {saving ? t("profileSaving") : t("profileSave")}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-primary-400">{t("labelName")}</p>
            <p className="font-medium">{profile?.name ?? "..."}</p>
          </div>
          <div>
            <p className="text-primary-400">{t("labelEmail")}</p>
            <p className="font-medium">{profile?.email ?? "..."}</p>
          </div>
          <div>
            <p className="text-primary-400">{t("labelJoined")}</p>
            <p className="font-medium">{profile ? formatDate(profile.createdAt) : "..."}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat icon={Package} label={t("totalOrders")} value={stats.orders} />
        <Stat icon={Truck} label={t("shippingOrders")} value={stats.shipping} />
        <Stat icon={Heart} label={t("wishlistCount")} value={stats.wishlist} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-primary-100 bg-white p-5">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-primary-500">{label}</p>
    </div>
  );
}
