# Hướng dẫn chạy dự án Minh Tien Fashion (Local)

## Yêu cầu
- Node.js >= 18
- Docker Desktop (đã cài)
- npm >= 9

## Bước 1: Khởi động Database & Redis
```bash
cd D:\Users\IdeaProjects\minh-tien-fashion
docker-compose up -d
```
Chờ ~10s cho postgres + redis healthy.

Kiểm tra:
```bash
docker-compose ps
```
Cả 2 service phải `healthy`.

## Bước 2: Cài dependencies
```bash
npm install
```
(Turborepo workspaces sẽ cài cho cả apps/api + apps/web + packages/types)

## Bước 3: Setup Backend
```bash
cd apps/api

# Copy env
cp .env.example .env

# Chạy migration
npx prisma migrate dev

# Seed data (admin + sản phẩm mẫu)
npx prisma db seed
```

## Bước 4: Chạy Backend
```bash
cd apps/api
npm run dev
```
API chạy tại: http://localhost:4000

Test nhanh:
```bash
curl http://localhost:4000/api/products
```

## Bước 5: Setup Frontend
```bash
cd apps/web

# Tạo .env.local nếu chưa có
# Nội dung:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Bước 6: Chạy Frontend
```bash
cd apps/web
npm run dev
```
Web chạy tại: http://localhost:3000

## Tài khoản test
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@minhtien.vn | admin123 |
| Customer | customer@example.com | customer123 |

## Lệnh hữu ích
```bash
# Xem DB bằng Prisma Studio
cd apps/api && npx prisma studio

# Reset DB (xoá + migrate + seed lại)
cd apps/api && npx prisma migrate reset

# Build production
npm run build

# Dừng docker
docker-compose down

# Dừng + xoá data
docker-compose down -v
```

## Mở bằng JetBrains IDE
- Mở folder `D:\Users\IdeaProjects\minh-tien-fashion`
- WebStorm / IntelliJ sẽ tự nhận monorepo
- Terminal trong IDE chạy các lệnh trên

## Troubleshooting
| Lỗi | Fix |
|-----|-----|
| `ECONNREFUSED :5432` | Docker chưa chạy → `docker-compose up -d` |
| `P1001: Can't reach database` | Chờ postgres healthy, hoặc check port 5432 |
| `EADDRINUSE :4000` | Có process khác dùng port → kill hoặc đổi PORT trong .env |
| `Module not found` | Chạy lại `npm install` ở root |
| Prisma client outdated | `cd apps/api && npx prisma generate` |
