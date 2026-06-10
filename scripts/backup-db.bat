@echo off
setlocal enabledelayedexpansion

:: Thông tin cấu hình
set CONTAINER_NAME=mtf-postgres
set DB_USER=minhtienfashion
set DB_NAME=minh_tien_fashion
set BACKUP_DIR=.\backups

:: Lấy thời gian để tạo tên file (Format YYYYMMDD_HHMMSS)
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a%%b)
set mytime=%mytime: =0%
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%mydate%_%mytime%.sql

:: Tạo thư mục backup nếu chưa tồn tại
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo =======================================================
echo ⏳ Bat dau backup database '%DB_NAME%'
echo 📦 Tu container: '%CONTAINER_NAME%'
echo =======================================================

:: Thực thi lệnh pg_dump bên trong container docker
docker exec -t %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% -F c > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo ✅ Backup thanh cong!
    echo 📂 File duoc luu tai: %BACKUP_FILE%
    echo 💡 Ghi chu: De restore file nay, hay chay lenh:
    echo docker exec -i %CONTAINER_NAME% pg_restore -U %DB_USER% -d %DB_NAME% -1 ^< %BACKUP_FILE%
) else (
    echo ❌ Backup that bai! Vui long kiem tra lai container docker.
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
)

echo =======================================================
pause
