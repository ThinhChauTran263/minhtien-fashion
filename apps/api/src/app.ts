import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRoutes } from "./routes/auth.routes";
import { phoneAuthRoutes } from "./routes/auth-phone.routes";
import { productRoutes } from "./routes/products.routes";
import { categoryRoutes } from "./routes/categories.routes";
import { cartRoutes } from "./routes/cart.routes";
import { orderRoutes } from "./routes/orders.routes";
import { userRoutes } from "./routes/users.routes";
import { adminRoutes } from "./routes/admin/index";
import { bannerRoutes } from "./routes/banners.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { sanitizeMiddleware } from "./middlewares/sanitize.middleware";
import { generalLimiter, loginLimiter, registerLimiter, uploadLimiter } from "./middlewares/rate-limit.middleware";
import { reviewRoutes } from "./routes/reviews.routes";
import { flashSaleRoutes } from "./routes/flashsale.routes";
import { loyaltyRoutes } from "./routes/loyalty.routes";
import { notificationRoutes } from "./routes/notifications.routes";
import { newsletterRoutes } from "./routes/newsletter.routes";
import { shippingRoutes } from "./routes/shipping.routes";
import { locationRoutes } from "./routes/location.routes";
import { sizeGuideRoutes } from "./routes/size-guide.routes";
import { returnRoutes } from "./routes/return.routes";
import { blogRoutes } from "./routes/blog.routes";
import { bundleRoutes } from "./routes/bundle.routes";
import { giftCardRoutes } from "./routes/giftcard.routes";
import { referralRoutes } from "./routes/referral.routes";
import { restockRoutes } from "./routes/restock.routes";
import { healthRoutes } from "./routes/health.routes";
import { tailoringRoutes } from "./routes/tailoring.routes";
import { requestLogger } from "./config/logger";

const app = express();
app.set("trust proxy", 1);

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "*.amazonaws.com", "*.cloudfront.net"],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({
  origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-idempotency-key"],
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);
app.use(requestLogger);
app.use("/api", generalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

app.use("/api/upload", uploadLimiter);

// Health check (DB + Redis)
app.use("/", healthRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", phoneAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/flash-sale", flashSaleRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/tailoring", tailoringRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/size-guide", sizeGuideRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/gift-cards", giftCardRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/products", restockRoutes);
app.use("/api/admin", adminRoutes);

// Serve uploaded files (local storage fallback khi khÃƒÂ´ng cÃƒÂ³ S3)
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Error handler (phÃ¡ÂºÂ£i Ã¡Â»Å¸ cuÃ¡Â»â€˜i)
app.use(errorMiddleware);

export { app };



