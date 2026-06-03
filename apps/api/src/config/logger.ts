import winston from "winston";
import { Request, Response, NextFunction } from "express";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Request logging + slow request detection
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: (req as any).user?.id,
    };
    if (duration > 1000) {
      logger.warn("slow_request", meta);
    } else if (res.statusCode >= 500) {
      logger.error("server_error", meta);
    } else {
      logger.info("request", meta);
    }
  });
  next();
}
