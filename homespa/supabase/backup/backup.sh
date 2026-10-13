#!/usr/bin/env bash
# Sao lưu hằng đêm: xuất toàn bộ dữ liệu -> mã hóa -> cất ra nơi KHÁC Supabase.
# Cần: pg_dump, gpg. Biến môi trường (KHÔNG ghi vào code, KHÔNG commit):
#   BACKUP_DB_URL   chuỗi kết nối Postgres (Supabase > Project Settings > Database)
#   BACKUP_PASS     mật khẩu mã hóa bản sao (Ly giữ riêng, mất là không mở được)
#   BACKUP_DIR      thư mục đích (mặc định ./backups) — nên là ổ/Drive riêng, ngoài Supabase
#   KEEP_DAYS       số ngày giữ (mặc định 30)
set -euo pipefail
: "${BACKUP_DB_URL:?thiếu BACKUP_DB_URL}" "${BACKUP_PASS:?thiếu BACKUP_PASS}"
DIR="${BACKUP_DIR:-./backups}"; KEEP="${KEEP_DAYS:-30}"; mkdir -p "$DIR"
OUT="$DIR/homespa-$(date -u +%Y%m%d-%H%M).sql.gpg"
pg_dump "$BACKUP_DB_URL" --no-owner --schema=public --schema=auth --schema=storage \
  | gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASS" --symmetric --cipher-algo AES256 -o "$OUT"
[ -s "$OUT" ] || { echo "Bản sao rỗng — lỗi" >&2; rm -f "$OUT"; exit 1; }
sha256sum "$OUT" > "$OUT.sha256"
find "$DIR" -name 'homespa-*' -mtime +"$KEEP" -delete
echo "OK: $OUT"
# Khôi phục thử (làm trên dự án TRỐNG, không phải dự án thật):
#   gpg --batch --passphrase "$BACKUP_PASS" -d file.sql.gpg | psql "$DB_URL_THU"
