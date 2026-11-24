-- ============================================================================
-- Migration 0003 – Phân quyền (GĐ3 mục 7). Chạy bằng tài khoản chủ.
-- Yêu cầu: role bot_app và backup_reader đã tồn tại (npm run db:setup).
--   bot_app       : ứng dụng bot – đọc/thêm/sửa; XÓA chỉ ở bảng nhật ký để dọn theo hạn.
--   backup_reader : script sao lưu – chỉ đọc.
-- pg-boss tự tạo bảng trong schema pgboss → tạo sẵn schema này cho bot_app làm chủ.
-- Khi lên Supabase: thêm migration bật RLS mọi bảng (không làm ở GĐ5).
-- ============================================================================

-- bot_app
GRANT USAGE ON SCHEMA app TO bot_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO bot_app;
GRANT DELETE ON app.messages, app.abuse_events, app.alerts, app.bot_turns, app.ai_calls, app.kb_versions TO bot_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO bot_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE ON TABLES TO bot_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO bot_app;
-- Bảng theo dõi migration: bot chỉ được xem
REVOKE INSERT, UPDATE, DELETE ON app.schema_migrations FROM bot_app;

-- backup_reader
GRANT USAGE ON SCHEMA app TO backup_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT ON TABLES TO backup_reader;

-- Hàng chờ pg-boss
CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION bot_app;
GRANT USAGE ON SCHEMA pgboss TO backup_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE bot_app IN SCHEMA pgboss GRANT SELECT ON TABLES TO backup_reader;
