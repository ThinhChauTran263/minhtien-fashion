#!/bin/bash

# Thông tin cấu hình
CONTAINER_NAME="mtf-postgres"
DB_USER="minhtienfashion"
DB_NAME="minh_tien_fashion"
BACKUP_DIR="./backups"

echo "======================================================="
echo " 🔄 KHÔI PHỤC DỮ LIỆU (RESTORE DATABASE)"
echo "======================================================="

# Kiểm tra Docker container
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "⚠️ Container $CONTAINER_NAME chưa chạy!"
    echo "Đang khởi động Docker compose..."
    docker compose up -d
    echo "Đợi 5 giây để database khởi động..."
    sleep 5
fi

# Tìm file backup mới nhất
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Không tìm thấy thư mục $BACKUP_DIR!"
    exit 1
fi

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Không tìm thấy file backup (.sql) nào trong thư mục $BACKUP_DIR!"
    exit 1
fi

echo "📦 Database: $DB_NAME"
echo "📂 File sẽ dùng: $LATEST_BACKUP"
echo ""
echo "⚠️ CẢNH BÁO: Hành động này sẽ xóa và ghi đè TOÀN BỘ dữ liệu hiện tại!"
read -p "Nhấn Enter để tiếp tục hoặc Ctrl+C để hủy..."

echo "⏳ Đang tiến hành restore..."
# Thực thi restore
docker exec -i $CONTAINER_NAME pg_restore -c -U $DB_USER -d $DB_NAME -1 < "$LATEST_BACKUP"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Restore THÀNH CÔNG! Dữ liệu đã được phục hồi."
else
    echo ""
    echo "❌ Restore CÓ LỖI (Các cảnh báo 'cannot drop' thường là bình thường nếu chạy trên máy mới)."
fi
echo "======================================================="
