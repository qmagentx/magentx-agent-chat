-- ============================================================================
-- Migration 0004 – Cho bot_app quyền CREATE trên database (để pg-boss tự cài/nâng cấp schema pgboss)
-- Lý do: pg-boss 12 luôn chạy "CREATE SCHEMA IF NOT EXISTS pgboss" lúc khởi động; PostgreSQL đòi quyền
-- CREATE ở mức database cho câu này dù schema đã tồn tại. Quyền này chỉ cho phép tạo schema mới,
-- KHÔNG cho đụng vào bảng trong schema app (quyền app vẫn theo 0003).
-- Dùng DO ... format() vì GRANT ON DATABASE cần tên database cụ thể (magentx_test / magentx_live).
-- ============================================================================
DO $$
BEGIN
  EXECUTE format('GRANT CREATE ON DATABASE %I TO bot_app', current_database());
END $$;
