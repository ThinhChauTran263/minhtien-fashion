import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  meilisearch: {
    host: process.env.MEILISEARCH_HOST ?? "",
    apiKey: process.env.MEILISEARCH_API_KEY ?? "",
  },
  jwt: {
    secret: required("JWT_SECRET", "dev-secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  aws: {
    s3Bucket: process.env.AWS_S3_BUCKET ?? "minh-tien-fashion",
    region: process.env.AWS_REGION ?? "ap-southeast-1",
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE ?? "",
    hashSecret: process.env.VNPAY_HASH_SECRET ?? "",
    url: process.env.VNPAY_URL ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL ?? "http://localhost:3000/thanh-toan/ket-qua",
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE ?? "",
    accessKey: process.env.MOMO_ACCESS_KEY ?? "",
    secretKey: process.env.MOMO_SECRET_KEY ?? "",
    endpoint: process.env.MOMO_ENDPOINT ?? "https://test-payment.momo.vn/v2/gateway/api/create",
    returnUrl: process.env.MOMO_RETURN_URL ?? "http://localhost:3000/thanh-toan/ket-qua",
    ipnUrl: process.env.MOMO_IPN_URL ?? "http://localhost:4000/api/payment/momo/callback",
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "mailto:no-reply@minhtien.vn",
  },
  ghn: {
    apiUrl: process.env.GHN_API_URL ?? "https://dev-online-gateway.ghn.vn/shiip/public-api",
    token: process.env.GHN_TOKEN ?? "",
    shopId: process.env.GHN_SHOP_ID ?? "",
    fromDistrict: Number(process.env.GHN_FROM_DISTRICT ?? 1442),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  einvoice: {
    url: process.env.EINVOICE_URL ?? "",
    username: process.env.EINVOICE_USERNAME ?? "",
    password: process.env.EINVOICE_PASSWORD ?? "",
    vatRate: Number(process.env.VAT_RATE ?? 8),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  isProd: process.env.NODE_ENV === "production",
} as const;

