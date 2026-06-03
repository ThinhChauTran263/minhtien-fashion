import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { AppError } from "./error.middleware";
import { ACCESS_TOKEN_COOKIE, getCookieValue } from "../utils/auth-cookies";

// Augment Express.User để khớp với passport types và AuthRequest
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : getCookieValue(req.headers.cookie, ACCESS_TOKEN_COOKIE);

    if (!token) {
      throw new AppError("Unauthorized - No token provided", 401);
    }

    const decoded = jwt.verify(token, env.jwt.secret, { algorithms: ["HS512"] }) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, deletedAt: true, isLocked: true },
    });

    if (!user || user.deletedAt) {
      throw new AppError("Unauthorized - User not found", 401);
    }
    if (user.isLocked) {
      throw new AppError("Unauthorized - User locked", 401);
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Unauthorized - Invalid token", 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : getCookieValue(req.headers.cookie, ACCESS_TOKEN_COOKIE);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.jwt.secret, { algorithms: ["HS512"] }) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, deletedAt: true, isLocked: true },
    });

    if (user && !user.deletedAt && !user.isLocked) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
    next();
  } catch {
    next();
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }
  if (req.user.role !== "ADMIN" && req.user.role !== "STAFF") {
    return next(new AppError("Forbidden - Admin access required", 403));
  }
  next();
};
