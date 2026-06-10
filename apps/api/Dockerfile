FROM node:20-alpine AS builder

WORKDIR /app

# Khai báo biến môi trường cho quá trình build (nếu Prisma cần)
ENV NODE_ENV=production

# Copy các file config cấu hình monorepo
COPY package*.json ./
COPY tsconfig.json ./

# Copy thư mục apps/api và các thư mục packages dùng chung
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Cài đặt toàn bộ dependencies (kể cả devDependencies để build typescript)
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Generate Prisma Client & Build API
RUN npm run db:generate --workspace=apps/api
RUN npm run build:api

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy từ builder sang
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy kết quả build của API
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

# Expose port
EXPOSE 8000

# Chạy app thông qua workspace
CMD ["npm", "run", "start", "--workspace=apps/api"]
