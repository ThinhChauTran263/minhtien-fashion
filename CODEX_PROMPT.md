# Codex CLI Prompt - Chạy dự án Minh Tien Fashion

## Mục tiêu
Chạy fullstack e-commerce project "Minh Tien Fashion" tại `D:\Users\IdeaProjects\minh-tien-fashion`, verify hoạt động đúng, fix bugs nếu có.

## Bước 1: Khởi động Database (Docker)

```bash
cd D:\Users\IdeaProjects\minh-tien-fashion
docker-compose up -d
```

Đợi 10 giây cho Postgres + Redis khởi động. Verify:
```bash
docker ps
```
Phải thấy 2 container: `mtf-postgres` và `mtf-redis` đang running.

## Bước 2: Setup Backend

```bash
cd D:\Users\IdeaProjects\minh-tien-fashion\apps\api
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

**Expected output cuối cùng:**
```
[DB] Connected to PostgreSQL
[Server] Minh Tien Fashion API running on port 4000
```

**Nếu lỗi "Cannot find module"**: chạy lại `npm install`
**Nếu lỗi "Connection refused"**: đợi thêm 10s cho Postgres, hoặc check `docker ps`

Giữ terminal này chạy, mở terminal mới cho frontend.

## Bước 3: Setup Frontend

```bash
cd D:\Users\IdeaProjects\minh-tien-fashion\apps\web
npm install
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

## Bước 4: Verify API hoạt động

Mở terminal mới, test API:

```bash
curl http://localhost:4000/health
```
Expected: `{"status":"ok","timestamp":"..."}`

```bash
curl http://localhost:4000/api/categories
```
Expected: `{"success":true,"data":[...]}`

```bash
curl http://localhost:4000/api/products/featured
```
Expected: `{"success":true,"data":[...]}`

## Bước 5: Verify Frontend

Mở browser tại http://localhost:3000

Kiểm tra:
1. Trang chủ load được, có header "MINH TIEN", có hero banner
2. Click "Áo có cổ" → trang danh mục hiển thị sản phẩm
3. Click vào 1 sản phẩm → trang chi tiết, chọn màu/size, bấm "Thêm vào giỏ"
4. Click icon giỏ hàng → trang giỏ hàng hiển thị item vừa thêm
5. Bấm "Tiến hành thanh toán" → trang checkout với form

## Bước 6: Test Auth API

```bash
# Đăng ký
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test User"}'

# Đăng nhập
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@minhtien.vn","password":"admin123"}'
```

Expected: trả về `{"success":true,"data":{"user":{...},"accessToken":"...","refreshToken":"..."}}`

## Các lỗi thường gặp và cách fix

### Lỗi 1: "ECONNREFUSED 127.0.0.1:5432"
- Nguyên nhân: Postgres chưa chạy
- Fix: `docker-compose up -d` và đợi 10s

### Lỗi 2: "Cannot find module '@prisma/client'"
- Fix: `cd apps/api && npx prisma generate`

### Lỗi 3: "Port 4000 already in use"
- Fix: `npx kill-port 4000` hoặc tìm process đang dùng port và kill

### Lỗi 4: "Module not found" trong Next.js
- Fix: `cd apps/web && rm -rf node_modules && npm install`

### Lỗi 5: TypeScript errors khi build
- Chạy `npx tsc --noEmit` để xem lỗi cụ thể
- Fix theo từng lỗi báo

## Tài khoản test (sau khi seed)

- Admin: `admin@minhtien.vn` / `admin123`
- Customer: `customer@example.com` / `customer123`

## Nếu cần reset database

```bash
cd D:\Users\IdeaProjects\minh-tien-fashion\apps\api
npx prisma migrate reset --force
npx prisma db seed
```

## Checklist hoàn thành

- [ ] Docker containers running (postgres, redis)
- [ ] API running on port 4000
- [ ] Frontend running on port 3000
- [ ] Homepage loads correctly
- [ ] Product listing works
- [ ] Product detail + add to cart works
- [ ] Cart page shows items
- [ ] Checkout page loads
- [ ] Auth API works (register/login)
