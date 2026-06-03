import { Router } from "express";
import { authService } from "../services/auth.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { forgotPasswordValidator, loginValidator, refreshValidator, registerValidator, resetPasswordValidator } from "../validators/auth.validator";
import { AppError } from "../middlewares/error.middleware";
import { clearAuthCookies, getCookieValue, REFRESH_TOKEN_COOKIE, setAuthCookies } from "../utils/auth-cookies";

const router = Router();

router.post("/register", validate(registerValidator), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result);
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...data } = result;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(loginValidator), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result);
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...data } = result;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", validate(refreshValidator), async (req, res, next) => {
  try {
    const refreshToken = getCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE) ?? req.body.refreshToken;
    if (!refreshToken) {
      throw new AppError("Refresh token khÃ´ng há»£p lá»‡", 401);
    }
    const tokens = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, data: {} });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", validate(forgotPasswordValidator), async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    // Luôn trả thành công để tránh email enumeration
    res.json({
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.",
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", validate(resetPasswordValidator), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/google - login với Google ID token
router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new AppError("Thiếu Google ID token", 400));
    }
    const result = await authService.loginWithGoogle(idToken);
    setAuthCookies(res, result);
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...data } = result;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as authRoutes };
