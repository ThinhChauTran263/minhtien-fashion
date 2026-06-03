import dotenv from "dotenv";

dotenv.config();

const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL chưa được set. Tạo database test riêng và thêm TEST_DATABASE_URL vào .env trước khi chạy test."
  );
}

if (testUrl === process.env.DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL trùng với DATABASE_URL! Test sẽ xóa mất data dev. Dừng lại."
  );
}

process.env.DATABASE_URL = testUrl;
process.env.DIRECT_DATABASE_URL = testUrl;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
