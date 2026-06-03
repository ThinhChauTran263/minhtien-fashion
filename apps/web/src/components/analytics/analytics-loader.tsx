"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "./google-analytics";
import { FacebookPixel } from "./facebook-pixel";
import { CookieConsent, hasConsent } from "@/components/cookie-consent";

export function AnalyticsLoader() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(hasConsent());
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
  const fbId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

  return (
    <>
      <CookieConsent onAccept={() => setAccepted(true)} />
      {accepted && gaId && <GoogleAnalytics gaId={gaId} />}
      {accepted && fbId && <FacebookPixel pixelId={fbId} />}
    </>
  );
}

