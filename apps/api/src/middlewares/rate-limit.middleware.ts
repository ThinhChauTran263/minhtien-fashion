import rateLimit from "express-rate-limit";

const jsonMessage = (message: string) => ({ success: false, error: message });
const skipUnlessRateLimitTest = (req: any) => process.env.NODE_ENV === "test" && req.headers["x-rate-limit-test"] !== "true";
const isDev = process.env.NODE_ENV === "development";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("QuÃƒÂ¡ nhiÃ¡Â»Âu request, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau"),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p sai quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau 15 phÃƒÂºt"),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("Ã„ÂÃ„Æ’ng kÃƒÂ½ quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau 1 giÃ¡Â»Â"),
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("TÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau"),
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("Upload quÃƒÂ¡ nhiÃ¡Â»Âu lÃ¡ÂºÂ§n, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau"),
});


export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipUnlessRateLimitTest,
  message: jsonMessage("Tạo thanh toán quá nhiều lần, vui lòng thử lại sau"),
});
