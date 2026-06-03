import { Router } from "express";
import { prisma } from "../config/database";
import { firebaseAuth, FIREBASE_ENABLED } from "../config/firebase";
import { AppError } from "../middlewares/error.middleware";
import { generateTokenPair } from "../utils/jwt";
import { setAuthCookies } from "../utils/auth-cookies";

const router = Router();

/**
 * POST /api/auth/phone
 * Body: { idToken: string } — Firebase ID token từ client sau khi verify OTP
 *
 * Luồng:
 * 1. Client dùng Firebase JS SDK gửi OTP → user verify → nhận idToken
 * 2. Client gửi idToken lên backend
 * 3. Backend verify idToken qua Firebase Admin → lấy phone number
 * 4. Tìm hoặc tạo user → trả JWT
 */
router.post("/phone", async (req, res, next) => {
  try {
    if (!FIREBASE_ENABLED || !firebaseAuth) {
      throw new AppError("Firebase chưa được cấu hình", 503);
    }

    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError("Thiếu idToken", 400);
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      throw new AppError("Token không chứa số điện thoại", 400);
    }

    let user = await prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: phone,
          email: `${phone.replace("+", "")}@phone.local`,
          emailVerified: false,
          role: "CUSTOMER",
        },
      });
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookies(res, tokens);

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
      },
    });
  } catch (err: any) {
    if (err.code === "auth/id-token-expired") {
      return next(new AppError("Token đã hết hạn", 401));
    }
    if (err.code === "auth/argument-error" || err.code === "auth/id-token-revoked") {
      return next(new AppError("Token không hợp lệ", 401));
    }
    next(err);
  }
});

export { router as phoneAuthRoutes };
