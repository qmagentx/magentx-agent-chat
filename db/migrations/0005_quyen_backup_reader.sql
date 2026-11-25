-- ============================================================================
-- Migration 0005 – backup_reader đọc được thêm bộ đếm số thứ tự (sequence) và bảng của pg-boss
-- Lý do: pg_dump cần SELECT trên sequence để ghi giá trị hiện tại; bảng pgboss do bot_app tạo sau 0003.
-- ============================================================================
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO backup_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA pgboss TO backup_reader;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pgboss TO backup_reader;
