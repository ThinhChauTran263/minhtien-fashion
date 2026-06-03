"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

export function NotificationToggle() {
  const t = useTranslations("notifications");
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    if (sup) {
      getSubscriptionStatus().then(setSubscribed);
    }
  }, []);

  if (!supported) {
    return (
      <p className="text-sm text-gray-400">
        {t("unsupported")}
      </p>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        toast.success(t("disabled"));
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setSubscribed(true);
          toast.success(t("enabled"));
        } else {
          toast.error(t("permissionError"));
        }
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
        subscribed
          ? "bg-primary-800 text-white hover:bg-primary-900"
          : "border border-primary-300 text-primary-700 hover:bg-primary-50"
      }`}
    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {loading ? t("processing") : subscribed ? t("on") : t("turnOn")}
    </button>
  );
}

