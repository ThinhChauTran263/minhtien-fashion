import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

export function initSentry() {
  if (!dsn) {
    console.log("[Sentry] DSN chưa cấu hình - error tracking bị tắt.");
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  console.log("[Sentry] Initialized");
}

export function captureException(err: unknown) {
  if (dsn) Sentry.captureException(err);
}
