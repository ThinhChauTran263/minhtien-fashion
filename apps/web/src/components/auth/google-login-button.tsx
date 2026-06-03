"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const t = useTranslations("googleLogin");

  useEffect(() => {
    if (!clientId) return;
    if (typeof window === "undefined" || !ref.current) return;

    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          try {
            const { data } = await api.post("/auth/google", { idToken: resp.credential });
            setAuth(data.data.user);
            toast.success(t("successToast"));
            router.push("/");
          } catch (err: any) {
            toast.error(err.response?.data?.message || t("failedToast"));
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [clientId, router, setAuth, t]);

  if (!clientId) return null;

  return (
    <div className="flex items-center justify-center">
      <div ref={ref} />
    </div>
  );
}

