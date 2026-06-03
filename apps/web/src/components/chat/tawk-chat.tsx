"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkChat() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;
    if (!propertyId || !widgetId) return;
    if (typeof window === "undefined") return;
    if (document.getElementById("tawk-script")) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      // khÃ´ng remove khi unmount Ä‘á»ƒ chat persist
    };
  }, []);

  // Pre-fill thÃ´ng tin user
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !window.Tawk_API) return;
    const setAttr = () => {
      try {
        window.Tawk_API.setAttributes(
          { name: user.name, email: user.email },
          () => undefined
        );
      } catch {
        /* ignore */
      }
    };
    if (window.Tawk_API.onLoad) setAttr();
    else window.Tawk_API.onLoad = setAttr;
  }, [user]);

  return null;
}

export function openChat() {
  if (typeof window === "undefined" || !window.Tawk_API) return;
  try {
    window.Tawk_API.maximize();
  } catch {
    /* ignore */
  }
}

