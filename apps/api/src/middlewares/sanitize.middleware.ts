import { NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script"] }).trim();
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      (value as Record<string, unknown>)[key] = sanitizeValue(child);
    }
  }
  return value;
}

export const sanitizeMiddleware = [
  mongoSanitize({ replaceWith: "_" }),
  (req: Request, _res: Response, next: NextFunction) => {
    req.body = sanitizeValue(req.body) as any;
    req.query = sanitizeValue(req.query) as any;
    req.params = sanitizeValue(req.params) as any;
    next();
  },
];
