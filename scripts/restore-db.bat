@echo off
setlocal enabledelayedexpansion

:: Thông tin cấu hình
set CONTAINER_NAME=mtf-postgres
set DB_USER=minhtienfashion
set DB_NAME=minh_tien_fashion
set BACKUP_DIR=.\backups

echo =======================================================
echo 🔄 KHOI PHUC DU LIEU (RESTORE DATABASE)
echo =======================================================

:: Kiểm tra container có đang chạy không
docker ps | findstr %CONTAINER_NAME% >nul
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Container %CONTAINER_NAME% chua chay!
    echo Dang khoi dong cac dich vu Docker...
    docker compose up -d
    echo Doi 5 giay de database khoi dong...
    timeout /t 5 >nul
)

:: Tìm file backup mới nhất trong thư mục backups
if not exist "%BACKUP_DIR%" (
    echo ❌ Khong tim thay thu muc %BACKUP_DIR%. Ban can co file backup de restore!
    pause
    exit /b
)

set NEWEST_FILE=
FOR /F "delims=|" %%I IN ('DIR "%BACKUP_DIR%\*.sql" /B /O:-D') DO (
    set NEWEST_FILE=%%I
    goto FoundFile
)
:FoundFile

if "%NEWEST_FILE%"=="" (
    echo ❌ Khong tim thay file .sql nao trong thu muc %BACKUP_DIR%!
    pause
    exit /b
)

set BACKUP_FILE=%BACKUP_DIR%\%NEWEST_FILE%

echo 📦 Database: %DB_NAME%
echo 📂 File se dung: %BACKUP_FILE%
echo.
echo ⚠️ CANH BAO: Hanh dong nay se xoa va ghi de TOAN BO du lieu hien tai!
echo Neu ban dang o may tinh moi, dieu nay la binh thuong.
echo.
pause

echo ⏳ Dang tien hanh restore...
:: Dùng pg_restore với cờ -c (clean) để xóa sạch db cũ trước khi tạo lại
docker exec -i %CONTAINER_NAME% pg_restore -c -U %DB_USER% -d %DB_NAME% -1 ^< "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Restore THANH CONG! Du lieu cua ban da duoc phuc hoi ve thoi diem cua file backup.
    echo Bay gio ban co the chay npm run dev de khoi dong project.
) else (
    echo.
    echo ❌ Restore THAT BAI! Vui long kiem tra lai. (Luu y: Cac loi kieu "cannot drop..." thuong la binh thuong neu la may moi tinh).
)

echo =======================================================
pause
