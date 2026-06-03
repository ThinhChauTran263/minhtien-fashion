"use server";

import { cookies } from "next/headers";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

export async function setLocale(locale: Locale) {
  const value: Locale = locales.includes(locale) ? locale : defaultLocale;
  cookies().set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

