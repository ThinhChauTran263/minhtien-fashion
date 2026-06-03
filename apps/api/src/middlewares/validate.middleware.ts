import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "./error.middleware";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) return next(new AppError(err.errors[0]?.message ?? "Dữ liệu không hợp lệ", 400));
      next(err);
    }
  };
}
