# Disaster Recovery Runbook

Mục tiêu: **RPO ≤ 1h**, **RTO ≤ 4h**.

## Backup hiện có
- **RDS automated backup**: retention 7-30 ngày, backup window 03:00-04:00 UTC, point-in-time recovery
- **Manual snapshot**: trước mỗi migrate/thay đổi lớn
- **Cross-region snapshot**: copy sang Tokyo (ap-northeast-1) phòng region down
- **pg_dump logical backup**: Lambda hàng ngày → S3 `mtf-backups/db/`
- **S3 uploads**: versioning + cross-region replication
- **App-level export**: `GET /api/admin/export/all` (chiến lược thứ 3)

---

## Scenario 1: DB corrupt / data loss
**RTO ước tính: 30-60 phút**

1. AWS Console → RDS → Snapshots
2. Chọn snapshot mới nhất trước thời điểm sự cố (hoặc dùng point-in-time recovery)
3. Restore to new instance: `mtf-prod-restored`
4. Update `DATABASE_URL` trong ECS task definition (qua Secrets Manager)
5. `aws ecs update-service --cluster mtf-cluster --service mtf-api --force-new-deployment`
6. Verify: `curl https://api.minhtien.vn/health` + smoke tests

## Scenario 2: Region down (Singapore)
**RTO ước tính: 2-4 giờ**

1. Restore snapshot ở region Tokyo (ap-northeast-1)
2. Deploy ECS service mới ở Tokyo (task definition + ALB)
3. Route53 → trỏ `api.minhtien.vn` sang ALB Tokyo
4. Vercel env → update `NEXT_PUBLIC_API_URL` nếu cần
5. Verify end-to-end

## Scenario 3: Code lỗi nghiêm trọng sau deploy
**RTO ước tính: 5-10 phút**

1. Rollback ECS về task definition trước:
   ```bash
   aws ecs update-service --cluster mtf-cluster --service mtf-api \
     --task-definition mtf-api:PREV_REVISION --force-new-deployment
   ```
2. Verify health + smoke tests
3. Điều tra root cause trên branch riêng

## Scenario 4: Xoá nhầm file S3
1. S3 bucket có versioning → restore version trước:
   ```bash
   aws s3api list-object-versions --bucket mtf-uploads --prefix <key>
   aws s3api copy-object --bucket mtf-uploads --key <key> \
     --copy-source "mtf-uploads/<key>?versionId=<VERSION>"
   ```

---

## DR Drill (diễn tập định kỳ)
- **Tần suất**: mỗi quý
- **Quy trình**:
  1. Restore snapshot mới nhất vào staging
  2. Verify: count products/orders/users so với production
  3. Test login admin + tạo đơn mới
  4. Đo thời gian thực tế, cập nhật RTO trong runbook này
- **Synthetic check sau restore**: chạy script verify không có dangling FK, tất cả user có email, tất cả order có items

## Backup monitoring
- Lambda check backup tồn tại mỗi sáng 8h → SNS alert nếu thiếu file ngày hôm đó
- CloudWatch alarm: RDS free storage < 10% → alert

## Liên hệ khẩn cấp
- DevOps lead: [điền]
- AWS support: [điền plan]
- Database owner: [điền]
