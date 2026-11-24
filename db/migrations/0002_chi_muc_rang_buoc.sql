-- ============================================================================
-- Migration 0002 – Chỉ mục, ràng buộc duy nhất có điều kiện, tự cập nhật updated_at
-- Theo GĐ3 mục 2 (chỉ mục messages), mục 3 (một đơn dở/hội thoại, chống trùng), A4 (một kb_version active).
-- ============================================================================

-- Tự ghi updated_at mỗi lần sửa dòng
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER pages_set_updated_at          BEFORE UPDATE ON app.pages          FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
CREATE TRIGGER staff_set_updated_at          BEFORE UPDATE ON app.staff          FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
CREATE TRIGGER conversations_set_updated_at  BEFORE UPDATE ON app.conversations  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
CREATE TRIGGER orders_set_updated_at         BEFORE UPDATE ON app.orders         FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
CREATE TRIGGER media_assets_set_updated_at   BEFORE UPDATE ON app.media_assets   FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- A4: chỉ một bản kiến thức đang dùng
CREATE UNIQUE INDEX kb_versions_one_active ON app.kb_versions (is_active) WHERE is_active;
CREATE INDEX kb_versions_synced_at ON app.kb_versions (synced_at DESC);

-- B1: tra khách theo SĐT (đơn cũ, học viên cũ)
CREATE INDEX customers_phone ON app.customers (phone) WHERE phone IS NOT NULL;
CREATE INDEX customers_last_seen ON app.customers (page_id, last_seen_at DESC);

-- B2: hội thoại đang xử lý / có tin mới / bị tạm dừng
CREATE INDEX conversations_last_customer_msg ON app.conversations (page_id, last_customer_msg_at DESC);
CREATE INDEX conversations_processing ON app.conversations (processing_since) WHERE processing_since IS NOT NULL;
CREATE INDEX conversations_bot_paused ON app.conversations (bot_paused_until) WHERE bot_paused_until IS NOT NULL;

-- B3: chống trùng tin Pancake (mã tin có thể trống với tin bot chưa gửi xong)
CREATE UNIQUE INDEX messages_conversation_pancake_id
  ON app.messages (conversation_id, pancake_message_id) WHERE pancake_message_id IS NOT NULL;
CREATE INDEX messages_conversation_sent_at ON app.messages (conversation_id, sent_at DESC);
CREATE INDEX messages_status_created_at ON app.messages (status, created_at);
CREATE INDEX messages_sent_at ON app.messages (sent_at);
CREATE INDEX messages_bot_content_hash ON app.messages (content_hash, created_at) WHERE sender_type = 'bot';

-- B4, B5: thống kê theo ngày/trang
CREATE INDEX bot_turns_page_created ON app.bot_turns (page_id, created_at DESC);
CREATE INDEX bot_turns_conversation_created ON app.bot_turns (conversation_id, created_at DESC);
CREATE INDEX handoffs_page_created ON app.handoffs (page_id, created_at DESC);
CREATE INDEX handoffs_open ON app.handoffs (conversation_id) WHERE resolved_at IS NULL;

-- C1: mỗi hội thoại chỉ MỘT đơn đang dở; đối chiếu tag ↔ đơn 10 phút/lần theo trạng thái
CREATE UNIQUE INDEX orders_one_open_per_conversation
  ON app.orders (conversation_id) WHERE status IN ('awaiting_transfer','awaiting_confirmation');
CREATE INDEX orders_status ON app.orders (status, updated_at DESC);
CREATE INDEX orders_page_created ON app.orders (page_id, created_at DESC);
CREATE INDEX orders_phone ON app.orders (phone) WHERE phone IS NOT NULL;
CREATE INDEX orders_payment_info_sent ON app.orders (conversation_id, payment_info_sent_at DESC)
  WHERE payment_info_sent_at IS NOT NULL;  -- ảnh trong 7 ngày sau khi gửi STK = bill

-- C2
CREATE INDEX sheet_pending_changes_pending ON app.sheet_pending_changes (detected_at) WHERE status = 'pending';

-- D
CREATE INDEX media_assets_status ON app.media_assets (status) WHERE active;
CREATE INDEX media_deliveries_conversation ON app.media_deliveries (conversation_id);

-- E
CREATE INDEX ai_calls_created ON app.ai_calls (created_at DESC);
CREATE INDEX ai_calls_page_created ON app.ai_calls (page_id, created_at DESC);
CREATE INDEX abuse_events_conversation ON app.abuse_events (conversation_id, created_at DESC);
CREATE INDEX abuse_events_created ON app.abuse_events (created_at);
CREATE INDEX alerts_sent_at ON app.alerts (sent_at DESC);
