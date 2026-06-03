# Enterprise Architecture Blueprint

Muc tieu: nang Minh Tien Fashion tu monorepo e-commerce da on dinh logic len kien truc chiu tai cao, de van hanh, quan sat, mo rong va phuc hoi theo chuan enterprise.

## Diem hien tai

- Frontend: Next.js 14 trong `apps/web`, dung React Query, Zustand, Next App Router va deploy phu hop tren Vercel.
- Backend: Express + TypeScript trong `apps/api`, co middleware bao mat, validate, rate limit, logging, Sentry, Redis, BullMQ workers va Prisma.
- Data: PostgreSQL qua Prisma, Redis cho cache/queue, S3/Cloudinary cho media, SES/Nodemailer cho email.
- Domain nghiep vu: product, cart, order, payment, inventory, shipping, return, loyalty, referral, gift card, blog, notification.
- Van hanh: co Docker, huong dan deploy AWS ECS Fargate, runbook disaster recovery.

## Kien truc muc tieu

```text
Users/Bots
  |
  v
CloudFront/Vercel Edge + WAF + Bot Protection
  |
  +--> Next.js Web (SSR/ISR/static pages)
  |
  v
API Gateway or ALB
  |
  v
Express API on ECS Fargate, multi-AZ, autoscaling
  |
  +--> PostgreSQL RDS primary + read replica
  +--> Redis ElastiCache cluster
  +--> BullMQ workers on separate ECS services
  +--> S3 + CloudFront media origin
  +--> SES/SNS/SQS/EventBridge integrations
  +--> Sentry/OpenTelemetry/CloudWatch/Grafana
```

## Nguyen tac thiet ke

- API stateless: moi request khong phu thuoc instance, scale ngang bang ECS replicas.
- Worker tach rieng API: API tra loi nhanh, viec cham nhu email, invoice, shipping, notification chay async.
- Database la system of record: tat ca thay doi ton kho, don hang, thanh toan phai co transaction va idempotency.
- Cache co chien luoc: cache san pham/category/content doc nhieu; khong cache du lieu nhay cam neu chua co invalidation ro rang.
- Observability truoc khi scale: log co correlation id, metrics, traces, SLO, alert va dashboard.
- Security by default: WAF, rate limit phan tang, secrets manager, least privilege, audit log, backup/restore drill.

## Nhom nang cap uu tien

### 1. Reliability va runtime

- Them `/readyz` va `/livez` tach rieng: liveness khong goi DB, readiness kiem tra DB/Redis voi timeout ngan.
- Graceful shutdown day du: dung nhan request moi, dong HTTP server, dong Prisma, dong Redis/BullMQ workers.
- Tach process roles: `api`, `worker-email`, `worker-invoice`, `worker-notification`, `worker-shipping`, `scheduler`.
- Them request id/correlation id qua header `x-request-id`, log theo structured JSON.
- Chuan hoa error envelope: `{ code, message, details, requestId }` cho frontend va admin debug.

### 2. Database va consistency

- Them idempotency key cho checkout/payment webhook/order creation de tranh tao don trung.
- Dung transaction cho checkout: reserve stock, create order, create payment intent, write stock movement.
- Them optimistic locking hoac conditional update cho `ProductVariant.stock` de tranh oversell.
- Audit cac query doc nhieu: product listing, search, admin report, order history; them composite indexes theo filter/sort that su dung.
- Them read replica strategy cho trang doc nhieu va report neu traffic tang.
- Chuan hoa migration production: `prisma migrate deploy`, backup truoc migrate, rollback plan theo migration.

### 3. Cache va performance

- Redis cache cho product detail, category tree, banners, flash sale, size guide, blog post.
- Cache keys co version: `product:v1:{slug}`, `category:v1:tree`, `home:v1:blocks`.
- Invalidation theo event: update product/category/banner thi xoa cache lien quan.
- HTTP caching: public content co `Cache-Control`, admin/private endpoint khong cache.
- Next.js ISR/revalidate cho trang san pham, category, blog; stale-while-revalidate cho noi dung marketing.
- CDN image optimization: S3 + CloudFront, signed upload, content hash key, long TTL.

### 4. Async jobs va event-driven

- Chuan hoa queue names va retry policy: backoff, attempts, dead-letter queue.
- Moi job co idempotency: email, invoice, stock notification, abandoned cart khong gui/tru lap.
- Tach scheduler khoi API instance de tranh multi-instance cron chay lap.
- Can nhac EventBridge/SQS cho event lien service: `order.created`, `payment.succeeded`, `stock.low`, `return.requested`.
- Them job dashboard/metrics: waiting, active, delayed, failed, retry count, duration p95.

### 5. Security va compliance

- WAF truoc API va web: SQLi/XSS managed rules, bot/rate rules, geo rules neu can.
- JWT rotation va refresh-token reuse detection; revoke token khi doi mat khau/logout all devices.
- RBAC cho admin: owner, manager, inventory, content, support; moi action nhay cam ghi audit log.
- Secrets Manager/Parameter Store cho tat ca secrets; khong luu secret trong image hoac repo.
- Payment webhook verify signature, idempotent, log raw event hash thay vi raw sensitive payload.
- PII minimization: mask phone/email trong log, export/delete customer data theo yeu cau.

### 6. Observability va SLO

- SLO de xuat: API availability 99.9%, checkout success rate >= 99%, p95 API < 300ms cho read, p95 checkout < 1.5s.
- Metrics bat buoc: request rate, error rate, latency p50/p95/p99, DB pool, Redis latency, queue depth, worker failures.
- Distributed tracing: request web -> API -> Prisma/Redis/queue voi OpenTelemetry.
- Alert theo user impact: checkout error spike, payment webhook failures, stock reservation failures, queue backlog.
- Dashboard rieng: Business KPIs, API health, DB health, Worker health, Security events.

### 7. Delivery va governance

- CI pipeline: typecheck, lint, unit tests, integration tests, build web/api, prisma validate, npm audit.
- Contract tests giua web va API bang OpenAPI hoac typed API schema.
- Staging gan production: DB snapshot masked, Redis rieng, payment sandbox, email sandbox.
- Blue/green hoac rolling deploy cho API; Vercel preview cho web.
- Feature flags cho thay doi lon: checkout flow, payment provider, promotion engine.

## Target deployment topology

- Web: Vercel Pro/Enterprise, edge cache, preview deployments, custom security headers.
- API: ECS Fargate service `mtf-api`, min 2 tasks, multi-AZ, autoscale theo CPU + request count + latency.
- Workers: ECS services rieng cho tung queue class, autoscale theo queue depth.
- Scheduler: mot ECS scheduled task hoac EventBridge schedule; khong chay cron trong moi API replica.
- Database: RDS PostgreSQL Multi-AZ, PITR, performance insights, read replica khi can.
- Redis: ElastiCache Redis Multi-AZ, eviction policy ro rang, memory alarms.
- Media: S3 private bucket + CloudFront OAC, lifecycle rules, versioning.

## Roadmap trien khai

### Phase 1: Production hardening (1-2 tuan)

- Tach health checks thanh live/readiness.
- Them request id, structured logging va error envelope.
- Tach scheduler/workers khoi API runtime.
- Them graceful shutdown cho API va workers.
- Them idempotency cho payment webhook va order creation.
- Them CI pipeline chay lint/typecheck/test/build.

### Phase 2: Scale va consistency (2-4 tuan)

- Refactor checkout thanh transaction ro rang voi stock reservation.
- Them cache service co versioned keys va invalidation theo write operations.
- Audit Prisma queries va them composite indexes cho product/order/admin reports.
- Chuan hoa BullMQ retry, DLQ va job idempotency.
- Them OpenAPI/contract tests cho endpoint quan trong.

### Phase 3: Observability va operations (2-3 tuan)

- Them OpenTelemetry traces va metrics exporter.
- Tao dashboard API/DB/Redis/queue/business.
- Thiet lap alert SLO cho checkout/payment/queue backlog.
- Chay DR drill staging va cap nhat RTO/RPO thuc te.
- Them audit log cho admin va RBAC chi tiet.

### Phase 4: Enterprise platform (4-8 tuan)

- WAF + bot protection + advanced rate limiting.
- Read replica/reporting path cho admin analytics.
- Event-driven integration bang EventBridge/SQS neu traffic va domain phuc tap tang.
- Blue/green deployment va feature flags.
- Load testing voi k6/Artillery, capacity plan theo traffic peak.

## Definition of done 10/10

- He thong scale ngang API/worker ma khong tao duplicate cron/job/order.
- Checkout va payment idempotent, transaction-safe, khong oversell trong concurrent load test.
- p95 latency va error budget duoc do bang dashboard, khong do cam tinh.
- DB/Redis/queue co metrics va alert truoc khi anh huong khach hang.
- Moi deploy co CI, rollback, migration strategy va smoke tests.
- Secrets, PII, admin action va payment webhook duoc bao ve va audit.
- DR drill da chay it nhat mot lan tren staging voi RTO/RPO ghi nhan.

## Viec nen lam ngay trong codebase

1. Tao `createServer()` tra ve HTTP server de graceful shutdown dung cach.
2. Tach `src/workers` va `src/jobs` khoi import mac dinh cua `src/index.ts`; tao entrypoint rieng `worker.ts` va `scheduler.ts`.
3. Them middleware `request-id` truoc logger va tra `x-request-id` ve client.
4. Them bang `IdempotencyKey` hoac `PaymentEvent` trong Prisma cho checkout/webhook.
5. Them cache invalidation tai service layer cho product/category/banner/blog.
6. Them test concurrency cho order stock reservation.
