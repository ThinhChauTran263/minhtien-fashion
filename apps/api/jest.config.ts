export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/env-setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  collectCoverageFrom: [
    "src/services/auth.service.ts",
    "src/services/cart.service.ts",
    "src/services/order.service.ts",
    "src/services/product.service.ts",
    "src/middlewares/**/*.ts",
  ],
};
