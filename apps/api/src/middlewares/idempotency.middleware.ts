import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { AppError } from "./error.middleware";

const IDEMPOTENCY_TTL = 300; // 5 phút

/**
 * Middleware Idempotency-Key dùng Redis.
 * Frontend PHẢI gửi header `x-idempotency-key` (UUID).
 * Nếu key đã tồn tại trong Redis → block request (409 Conflict).
 * Nếu chưa → set key với TTL 5 phút, cho request đi tiếp.
 */
export function idempotencyMiddleware(req: Request, _res: Response, next: NextFunction) {
  const key = req.headers["x-idempotency-key"] as string | undefined;

  if (!key || key.length < 8) {
    return next(new AppError("Header x-idempotency-key là bắt buộc (UUID)", 400));
  }

  const redisKey = `idempotency:${key}`;

  redis
    .set(redisKey, "1", "EX", IDEMPOTENCY_TTL, "NX")
    .then((result) => {
      if (result === null) {
        return next(new AppError("Request đã được xử lý (duplicate). Vui lòng không gửi lại.", 409));
      }
      next();
    })
    .catch((err) => {
      console.error("[Idempotency]", err);
      next();
    });
}
