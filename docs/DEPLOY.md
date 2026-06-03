# Production Deployment Guide

Hướng dẫn deploy Minh Tien Fashion lên production: **Frontend trên Vercel**, **Backend trên AWS ECS Fargate**.

## Kiến trúc

```
                ┌─────────────────┐
                │  Vercel (Web)   │  https://minhtien.vn
                └────────┬────────┘
                         │
                         ▼
┌──────────────────────────────────────────────┐
│  AWS                                          │
│   Route53 → ALB → ECS Fargate (mtf-api)       │  https://api.minhtien.vn
│                ↓                               │
│   RDS Postgres   ElastiCache Redis             │
│   S3 + CloudFront (ảnh sản phẩm)               │
│   SES (email)                                  │
│   Secrets Manager (env vars)                   │
└──────────────────────────────────────────────┘
```

---

## PHẦN A: Deploy Frontend (Vercel)

### 1. Push code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/minh-tien-fashion.git
git push -u origin main
```

### 2. Import project lên Vercel

- Vào https://vercel.com → **New Project** → Import từ GitHub
- **Root directory**: `apps/web`
- **Framework**: Next.js (auto detect)
- **Build command**: `npm run build`
- **Install command**: `npm install`

### 3. Environment variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.minhtien.vn` |
| `NEXT_PUBLIC_SITE_URL` | `https://minhtien.vn` |

### 4. Domain

Settings → Domains → Add `minhtien.vn` (apex) + `www.minhtien.vn`

Update DNS theo hướng dẫn của Vercel (thường là CNAME hoặc A record).

---

## PHẦN B: Deploy Backend (AWS)

### 1. RDS Postgres

```bash
aws rds create-db-instance \
  --db-instance-identifier mtf-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --db-name minh_tien_fashion \
  --no-publicly-accessible \
  --vpc-security-group-ids <SG_ID>
```

Lưu endpoint: `xxx.region.rds.amazonaws.com:5432`.

### 2. ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id mtf-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids <SG_ID>
```

### 3. S3 bucket cho ảnh

```bash
aws s3 mb s3://minh-tien-fashion --region ap-southeast-1
aws s3api put-bucket-cors --bucket minh-tien-fashion --cors-configuration file://docker/s3-cors.json
```

Bật **public read** hoặc dùng CloudFront OAC để serve qua HTTPS.

### 4. CloudFront cho S3

- Create distribution → Origin: S3 bucket
- Viewer protocol: HTTPS only
- Cache behavior: cache 1 năm cho `/products/*`
- Lưu domain: `dXXXX.cloudfront.net`

### 5. Secrets Manager

Tạo các secret:

```bash
aws secretsmanager create-secret --name mtf/database-url --secret-string "postgresql://postgres:PASSWORD@xxx.rds.amazonaws.com:5432/minh_tien_fashion"
aws secretsmanager create-secret --name mtf/redis-url --secret-string "redis://xxx.cache.amazonaws.com:6379"
aws secretsmanager create-secret --name mtf/jwt-secret --secret-string "$(openssl rand -hex 32)"
aws secretsmanager create-secret --name mtf/jwt-refresh-secret --secret-string "$(openssl rand -hex 32)"
aws secretsmanager create-secret --name mtf/vnpay-tmn-code --secret-string "<VNPAY_TMN_CODE>"
aws secretsmanager create-secret --name mtf/vnpay-hash-secret --secret-string "<VNPAY_HASH_SECRET>"
aws secretsmanager create-secret --name mtf/momo-partner-code --secret-string "<MOMO_PARTNER_CODE>"
aws secretsmanager create-secret --name mtf/momo-access-key --secret-string "<MOMO_ACCESS_KEY>"
aws secretsmanager create-secret --name mtf/momo-secret-key --secret-string "<MOMO_SECRET_KEY>"
```

### 6. ECR + Build/Push image

```bash
# Tạo ECR repo
aws ecr create-repository --repository-name mtf-api --region ap-southeast-1

# Login
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.ap-southeast-1.amazonaws.com

# Build (chạy từ root monorepo)
docker build -f docker/api.Dockerfile -t mtf-api .

# Tag + Push
docker tag mtf-api:latest <ACCOUNT>.dkr.ecr.ap-southeast-1.amazonaws.com/mtf-api:latest
docker push <ACCOUNT>.dkr.ecr.ap-southeast-1.amazonaws.com/mtf-api:latest
```

### 7. ECS Task Definition

Sửa `docker/ecs-task-definition.json` thay `ACCOUNT_ID` thật, rồi:

```bash
aws ecs register-task-definition \
  --cli-input-json file://docker/ecs-task-definition.json
```

### 8. ECS Cluster + Service + ALB

```bash
# Cluster
aws ecs create-cluster --cluster-name mtf-cluster

# Service (cần ALB target group đã tạo trước)
aws ecs create-service \
  --cluster mtf-cluster \
  --service-name mtf-api \
  --task-definition mtf-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=mtf-api,containerPort=4000"
```

ALB:
- Listener 443 (HTTPS) → forward target group `mtf-api-tg`
- Health check path: `/health`
- ACM certificate cho `*.minhtien.vn`

### 9. Migrate database production

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@xxx.rds.amazonaws.com:5432/minh_tien_fashion" \
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# (Optional) seed
DATABASE_URL=... npm run db:seed
```

### 10. Route53

Tạo A record alias `api.minhtien.vn` → ALB.

---

## PHẦN C: CI/CD GitHub Actions

Workflow đã có sẵn ở `.github/workflows/deploy-api.yml`. Thêm secrets vào GitHub repo:

| Secret | Giá trị |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user có quyền ECR + ECS + Secrets |
| `AWS_SECRET_ACCESS_KEY` | Tương ứng |
| `DATABASE_URL` | Để chạy `prisma migrate deploy` trong CI |

Khi push lên `main` ảnh hưởng `apps/api/**`, workflow sẽ:
1. Type check
2. Build Docker image
3. Push lên ECR
4. Migrate DB
5. Force redeploy ECS service

---

## Checklist sau deploy

- [ ] `https://minhtien.vn` load OK
- [ ] `https://api.minhtien.vn/health` trả `{ "status": "ok" }`
- [ ] Login admin → vào `/admin` thấy dashboard
- [ ] Đặt 1 đơn end-to-end (COD)
- [ ] Test thanh toán VNPay sandbox
- [ ] CloudWatch logs không có lỗi nghiêm trọng
- [ ] Lighthouse score Web > 90 (Performance + SEO)
- [ ] Sitemap accessible: `https://minhtien.vn/sitemap.xml`
- [ ] Robots accessible: `https://minhtien.vn/robots.txt`

## Monitoring + Alerts

- **CloudWatch Alarms**: CPU > 80%, Memory > 80%, 5XX errors > 1%
- **Sentry** (optional): wrap app.ts với `@sentry/node`
- **CloudWatch Logs Insights** queries cho error spike

## Chi phí ước tính

| Component | Cost / tháng |
|-----------|---------------|
| Vercel Hobby / Pro | $0 / $20 |
| RDS db.t3.micro | ~$15 |
| ECS Fargate 0.25 vCPU | ~$10-15 |
| ElastiCache t3.micro | ~$13 |
| ALB | ~$16 |
| S3 + CloudFront | ~$5-10 |
| **Total** | **~$60-90** |
