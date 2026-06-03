import type { Response } from "express";
import { env } from "../config/env";

export const ACCESS_TOKEN_COOKIE = "mtf_access_token";
export const REFRESH_TOKEN_COOKIE = "mtf_refresh_token";

const accessMaxAgeMs = 15 * 60 * 1000;
const refreshMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, baseCookieOptions(accessMaxAgeMs));
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, baseCookieOptions(refreshMaxAgeMs));
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions(0), maxAge: undefined });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseCookieOptions(0), maxAge: undefined });
}

export function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(name.length + 1));
}
