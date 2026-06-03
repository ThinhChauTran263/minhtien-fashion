"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect, useTransition } from "react";
import { setLocale } from "@/i18n/locale";
import { locales, type Locale } from "@/i18n/config";

const codes: Record<Locale, string> = { vi: "VI", en: "EN" };

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const change = (l: Locale) => {
    setOpen(false);
    if (l === locale) return;
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-primary-800 cursor-pointer disabled:opacity-50"
        aria-label={t("label")}
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{codes[locale]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden min-w-[140px] z-50">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => change(l)}
              className={`block w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
                locale === l ? "bg-primary-50 text-primary-800" : "hover:bg-gray-50"
              }`}
            >
              {t(l)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

