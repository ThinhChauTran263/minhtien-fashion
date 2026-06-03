"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent({ onAccept }: { onAccept?: () => void }) {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const handle = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "rejected");
    setVisible(false);
    if (accepted) onAccept?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 safe-bottom">
      <button
        onClick={() => handle(false)}
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
        aria-label={t("close")}
      >
        <X className="w-4 h-4" />
      </button>
      <h3 className="font-medium text-gray-900 pr-6">{t("title")}</h3>
      <p className="mt-1 text-sm text-gray-500">
        {t.rich("text", {
          link: (chunks) => (
            <Link href="/guides/faq" className="text-accent hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => handle(true)} className="btn-primary !py-2 text-sm flex-1 cursor-pointer">
          {t("accept")}
        </button>
        <button onClick={() => handle(false)} className="btn-outline !py-2 text-sm cursor-pointer">
          {t("reject")}
        </button>
      </div>
    </div>
  );
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "accepted";
}

