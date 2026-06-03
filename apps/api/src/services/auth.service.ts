import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/database";
import { redis } from "../config/redis";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";
import { AppError } from "../middlewares/error.middleware";
import { emailService } from "./email.service";
import { emailQueueService } from "./email-queue.service";
import { env } from "../config/env";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const RESET_TTL = 60 * 60; // 1h
const RESET_PREFIX = "reset:";

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new AppError("Email đã được sử dụng", 400);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
      },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || !user.passwordHash) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    if (user.deletedAt) {
      throw new AppError("Tài khoản không tồn tại", 401);
    }
    if (user.isLocked) {
      throw new AppError("Tài khoản đã bị khóa", 403);
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Check Redis blacklist (token bị revoke khi admin khoá user)
      const isRevoked = await redis.get(`revoked:refresh:${payload.userId}`);
      if (isRevoked) {
        throw new AppError("Tài khoản đã bị khoá", 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, deletedAt: true, isLocked: true },
      });
      if (!user || user.deletedAt) {
        throw new AppError("User không tồn tại", 401);
      }

      if (user.isLocked) {
        throw new AppError("Tài khoản đã bị khóa", 401);
      }

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      return tokens;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Refresh token không hợp lệ", 401);
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        deletedAt: true,
        isLocked: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError("User không tồn tại", 404);
    }
    if (user.deletedAt) {
      throw new AppError("User không tồn tại", 404);
    }
    if (user.isLocked) {
      throw new AppError("Tài khoản đã bị khóa", 403);
    }
    return user;
  },

  /**
   * Tạo token reset password và gửi email.
   * Luôn trả về thành công để tránh email enumeration.
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Không tiết lộ email tồn tại hay không
    if (!user) {
      return { sent: false };
    }

    const token = crypto.randomBytes(32).toString("hex");
    await redis.setex(`${RESET_PREFIX}${token}`, RESET_TTL, user.id);

    const resetBase =
      process.env.RESET_PASSWORD_URL || `${env.frontendUrl}/dat-lai-mat-khau`;
    const resetLink = `${resetBase}?token=${token}`;

    // Gửi async không block response
    await emailQueueService.sendGeneric(
      user.email,
      "Minh Tien Fashion - Đặt lại mật khẩu",
      `Chào ${user.name}, click vào link sau để đặt lại mật khẩu: ${resetLink}`
    );

    return { sent: true };
  },

  /**
   * Verify token + đổi mật khẩu. Token chỉ dùng được 1 lần.
   */
  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new AppError("Thiếu token", 400);
    if (newPassword.length < 6) {
      throw new AppError("Mật khẩu tối thiểu 6 ký tự", 400);
    }

    const key = `${RESET_PREFIX}${token}`;
    const userId = await redis.get(key);
    if (!userId) {
      throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Xoá token sau khi dùng (one-time use)
    await redis.del(key);

    return { success: true };
  },

  /**
   * Login bằng Google ID token. Tạo user nếu chưa có.
   */
  async loginWithGoogle(idToken: string) {
    if (!googleClient) {
      throw new AppError("Google login chưa được cấu hình", 503);
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new AppError("Không lấy được thông tin Google", 400);
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name ?? payload.email.split("@")[0],
          avatar: payload.picture,
          emailVerified: true,
        },
      });
    } else if (!user.googleId) {
      // Link account nếu user đã có email nhưng chưa link Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, emailVerified: true, avatar: user.avatar ?? payload.picture ?? null },
      });
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  },
};
