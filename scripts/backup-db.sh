#!/bin/bash

# Thông tin cấu hình
CONTAINER_NAME="mtf-postgres"
DB_USER="minhtienfashion"
DB_NAME="minh_tien_fashion"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"

# Tạo thư mục backup nếu chưa tồn tại
mkdir -p "$BACKUP_DIR"

echo "⏳ Bắt đầu backup database '${DB_NAME}' từ container '${CONTAINER_NAME}'..."

# Thực thi lệnh pg_dump bên trong container docker (Backup định dạng custom -F c để có thể restore bằng pg_restore)
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME -F c > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup thành công!"
  echo "📂 File được lưu tại: $BACKUP_FILE"
  echo "💡 Ghi chú: Để restore file này, hãy chạy lệnh:"
  echo "docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME -1 < $BACKUP_FILE"
else
  echo "❌ Backup thất bại! Vui lòng kiểm tra lại container docker."
  # Xóa file rỗng nếu lỗi
  rm -f "$BACKUP_FILE"
fi
