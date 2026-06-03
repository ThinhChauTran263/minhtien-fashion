"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Capture referral code from ?ref= URL
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) localStorage.setItem("mtf-referral", ref);
    } catch {
      /* ignore */
    }

    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !window.location.hostname.includes("localhost")) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[SW] Register failed:", err);
    });
  }, []);

  return null;
}

