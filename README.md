# Minh Tien Fashion

Website bán áo nam (áo có cổ + áo cổ tròn) — fullstack monorepo.

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, Lucide Icons → deploy **Vercel**
- **Backend**: Node.js, Express, Prisma, PostgreSQL, Redis, JWT, Zod → deploy **AWS ECS Fargate**
- **Database**: PostgreSQL (RDS) + Redis (ElastiCache)
- **Storage**: AWS S3 + CloudFront

## Cấu trúc

```
minh-tien-fashion/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   └── types/        # Shared TypeScript types
├── docker/
│   └── api.Dockerfile  # Production Docker image
└── docker-compose.yml  # Local dev DB + Redis
```

## Quick Start

### 1. Khởi động database (Postgres + Redis)
```bash
docker-compose up -d
```

### 2. Setup Backend
```bash
cd apps/api
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
API chạy tại http://localhost:4000

### 3. Setup Frontend
```bash
cd apps/web
npm install
npm run dev
```
Web chạy tại http://localhost:3000

### 4. Tài khoản test (sau khi seed)
- Admin: `admin@minhtien.vn` / `admin123`
- Customer: `customer@example.com` / `customer123`

## Tính năng đã có

### Frontend
- Trang chủ (hero, danh mục, sản phẩm nổi bật, USP)
- Danh sách sản phẩm với filter (size, màu) + sort
- Trang `/ao-co-co` và `/ao-co-tron`
- Chi tiết sản phẩm: gallery, chọn màu/size, thêm giỏ hàng
- Giỏ hàng (lưu localStorage)
- Checkout (form địa chỉ, chọn payment method)
- Đăng nhập / Đăng ký
- Header với cart count, mobile menu
- Footer

### Backend
- Auth (register, login, refresh, get-me)
- Products (filter, search, featured, new arrivals, detail)
- Categories (tree)
- Cart CRUD (cần login)
- Orders (checkout với transaction trừ kho, voucher, tracking)
- Users (profile, address, wishlist, password change)
- Admin (dashboard stats, CRUD products, manage orders)
- Banners

## Deploy

### Frontend (Vercel)
1. Push code lên GitHub
2. Vào vercel.com → Import project
3. Root directory: `apps/web`
4. Set env: `NEXT_PUBLIC_API_URL=https://api.yoursite.com`
5. Deploy

### Backend (AWS ECS Fargate)
1. Build Docker image: `docker build -f docker/api.Dockerfile -t mtf-api .`
2. Push lên AWS ECR
3. Tạo ECS Task Definition + Service
4. Set up RDS Postgres + ElastiCache Redis
5. Configure ALB + Route 53

## API Endpoints chính

### Public
- `GET /api/products?collarType=CO_CO&size=L&page=1`
- `GET /api/products/:slug`
- `GET /api/products/featured`
- `GET /api/categories`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/orders/track/:code` (guest)

### Authenticated
- `GET /api/cart`
- `POST /api/cart/items`
- `POST /api/orders` (checkout)
- `GET /api/orders` (my orders)
- `GET /api/users/profile`

### Admin (cần role ADMIN)
- `GET /api/admin/dashboard`
- `POST /api/admin/products`
- `PATCH /api/admin/orders/:id/status`

## Roadmap

- [ ] Tích hợp VNPay + Momo callback
- [ ] Upload ảnh lên S3
- [ ] Email xác nhận đơn (AWS SES)
- [ ] Review sản phẩm
- [ ] Voucher / Flash sale
- [ ] Admin UI (Next.js admin pages)
- [ ] Search Elasticsearch
- [ ] Multi-language

## Chi phí ước tính

~$50-75/tháng cho giai đoạn MVP (RDS t3.micro, Fargate 0.25vCPU, ElastiCache t3.micro, Vercel Hobby/Pro).
