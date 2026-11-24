-- ============================================================================
-- Migration 0001 – Schema `app` và 18 bảng
-- Theo: tài liệu GĐ3 mục 2 (17 bảng) + thay đổi GĐ4 (tóm tắt GĐ5 mục 6):
--   • orders: bỏ confirm_channel = pancake_tag (chỉ còn telegram); thêm lý do hủy
--     "nhân viên gỡ tag", lưu trạng thái trước khi hủy để khôi phục trong 24 giờ.
--   • Bảng mới sheet_pending_changes: thay đổi Sheet chờ duyệt (STK, quyền/nơi nhận tin).
--   • handoffs.reason có late_over_23h; alerts.kind thêm các loại tin GĐ4.
-- Quy ước (GĐ3 mục 0): giờ lưu timestamptz (UTC); tiền là số nguyên VND; trạng thái dạng chữ
-- có CHECK; khóa ngoại cấm xóa (ON DELETE RESTRICT); không bao giờ xóa dòng cấu hình, chỉ active=false.
-- File đã chạy KHÔNG sửa. Cần đổi → thêm file 000N mới.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS app;

-- ---------------------------------------------------------------------------
-- A. CẤU HÌNH
-- ---------------------------------------------------------------------------

-- A1. Trang/kênh (đồng bộ từ tab "Cài đặt trang")
CREATE TABLE app.pages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key           text NOT NULL UNIQUE,            -- vd fb-magentx, ig-magentx, fb-test
  pancake_page_id    text NOT NULL UNIQUE,
  platform           text NOT NULL CHECK (platform IN ('facebook','instagram','tiktok','zalo_oa','other')),
  name               text NOT NULL,
  mode               text NOT NULL DEFAULT 'off' CHECK (mode IN ('off','test','on')),
  is_test_page       boolean NOT NULL DEFAULT false,
  course_codes       text[] NOT NULL DEFAULT '{}',
  address_style      text NOT NULL DEFAULT 'minh_ban' CHECK (address_style IN ('minh_ban','em_anhchi')),
  staff_hours_start  time NOT NULL DEFAULT '08:00',
  staff_hours_end    time NOT NULL DEFAULT '22:00',
  rr_last_staff_id   uuid,                            -- FK tới staff, thêm bên dưới
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- A2. Nhân viên (đồng bộ từ tab "Nhân viên"; không xóa, chỉ active=false)
CREATE TABLE app.staff (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text NOT NULL,
  pancake_user_id           text UNIQUE,
  telegram_user_id          bigint UNIQUE,
  is_admin                  boolean NOT NULL DEFAULT false,  -- cảnh báo hệ thống, /tatbot, duyệt STK
  can_confirm_payment       boolean NOT NULL DEFAULT false,  -- được bấm "Tiền đã về"
  receives_downtime_alerts  boolean NOT NULL DEFAULT false,  -- nhận tin riêng khi bot ngừng trong giờ trực
  active                    boolean NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app.pages
  ADD CONSTRAINT pages_rr_last_staff_fk FOREIGN KEY (rr_last_staff_id) REFERENCES app.staff(id) ON DELETE RESTRICT;

-- A3. Nhân viên nhận khách của từng trang
CREATE TABLE app.page_staff (
  page_id            uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  staff_id           uuid NOT NULL REFERENCES app.staff(id) ON DELETE RESTRICT,
  receives_handoffs  boolean NOT NULL DEFAULT true,
  PRIMARY KEY (page_id, staff_id)
);

-- A4. Bản chụp kho kiến thức (mỗi lần đồng bộ Sheet). Giữ 30 bản + bản được đơn tham chiếu.
CREATE TABLE app.kb_versions (
  id                bigserial PRIMARY KEY,
  synced_at         timestamptz NOT NULL DEFAULT now(),
  content_hash      text NOT NULL,
  content           jsonb NOT NULL,
  status            text NOT NULL CHECK (status IN ('valid','partial','invalid')),
  errors            jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active         boolean NOT NULL DEFAULT false,  -- chỉ một dòng true (chỉ mục ở 0002)
  bank_fingerprint  text
);

-- A5. Trạng thái hệ thống – chỉ bot/Telegram ghi, Sheet không ghi vào.
-- key: emergency_stop:<page_key> | emergency_stop:all | approved_bank_fingerprint | savings_mode
--      | last_kb_sync_ok_at | last_processed_at:<page_key> | last_heartbeat_at | last_backup_ok_at
--      | weekly_review_read_at (GĐ4: ngày bấm "Đã đọc 30 hội thoại")
CREATE TABLE app.system_state (
  key                  text PRIMARY KEY,
  value                jsonb NOT NULL,
  updated_by_staff_id  uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- B. KHÁCH & HỘI THOẠI
-- ---------------------------------------------------------------------------

-- B1. Hồ sơ khách. phone là MỘT trong hai cột duy nhất được chứa SĐT (cột kia: orders.phone).
CREATE TABLE app.customers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id              uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  pancake_customer_id  text NOT NULL,
  display_name         text,
  phone                text CHECK (phone IS NULL OR phone ~ '^0[0-9]{9}$'),
  phone_collected_at   timestamptz,
  interested_courses   text[] NOT NULL DEFAULT '{}',
  experience_level     text,
  goal                 text,
  pain_points          text,
  objections           text,
  profile_summary      text,                          -- lớp 1 trí nhớ
  first_seen_at        timestamptz NOT NULL DEFAULT now(),
  last_seen_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, pancake_customer_id)
);

-- B2. Hội thoại. "Ai đang giữ hội thoại" tính lại mỗi lần từ tag Pancake + bot_paused_until + system_state.
CREATE TABLE app.conversations (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id                      uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  customer_id                  uuid NOT NULL REFERENCES app.customers(id) ON DELETE RESTRICT,
  pancake_conversation_id      text NOT NULL,
  stage                        text NOT NULL DEFAULT 'new'
                               CHECK (stage IN ('new','discovering','consulting','asking_contact','payment_sent')),
  tags                         text[] NOT NULL DEFAULT '{}',  -- bản sao để tra cứu, không làm căn cứ
  tags_synced_at               timestamptz,
  is_test                      boolean NOT NULL DEFAULT false,
  processing_since             timestamptz,                   -- khóa "một việc một lúc"
  bot_paused_until             timestamptz,                   -- nhân viên nhắn tay → dừng 24 giờ
  last_customer_msg_at         timestamptz,
  last_staff_msg_at            timestamptz,
  last_bot_msg_at              timestamptz,
  images_read_count            integer NOT NULL DEFAULT 0,
  misunderstood_count          integer NOT NULL DEFAULT 0,
  abuse_count                  integer NOT NULL DEFAULT 0,
  source_ad_id                 text,
  started_from_ad_auto_reply   boolean NOT NULL DEFAULT false,
  memory_summary               text,                          -- lớp 3 trí nhớ
  memory_summary_upto          timestamptz,
  assigned_staff_id            uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, pancake_conversation_id)
);

-- B3. Nhật ký tin nhắn (giữ 90 ngày) + sổ chờ gửi (ghi trước, gửi sau). Tin khách đã che SĐT.
CREATE TABLE app.messages (
  id                   bigserial PRIMARY KEY,
  conversation_id      uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  pancake_message_id   text,
  client_ref           text UNIQUE,                   -- mã chống trùng tin bot
  direction            text NOT NULL CHECK (direction IN ('in','out')),
  sender_type          text NOT NULL CHECK (sender_type IN ('customer','bot','staff','meta_auto','unknown')),
  status               text NOT NULL CHECK (status IN ('received','pending','sent','failed')),
  staff_id             uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  content_masked       text CHECK (content_masked IS NULL OR char_length(content_masked) <= 2000),
  content_hash         text,
  attachment_type      text NOT NULL DEFAULT 'none'
                       CHECK (attachment_type IN ('none','image','sticker','video','audio','file','link')),
  sent_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- B4. Mỗi lượt bot xử lý
CREATE TABLE app.bot_turns (
  id                    bigserial PRIMARY KEY,
  conversation_id       uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  page_id               uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  last_customer_msg_at  timestamptz,
  replied_at            timestamptz,
  latency_ms            integer,
  is_recovery           boolean NOT NULL DEFAULT false,   -- xử lý tin sót sau khi bot ngừng, không tính chỉ số 5 giây
  route                 text NOT NULL
                        CHECK (route IN ('template','ai_haiku','ai_sonnet','handoff','blocked','ignored','superseded')),
  block_reason          text,
  validation            text NOT NULL DEFAULT 'not_applicable'
                        CHECK (validation IN ('passed','failed','not_applicable')),
  kb_version_id         bigint REFERENCES app.kb_versions(id) ON DELETE RESTRICT,
  media_sent_count      integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- B5. Lần chuyển nhân viên
CREATE TABLE app.handoffs (
  id                 bigserial PRIMARY KEY,
  conversation_id    uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  page_id            uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  reason             text NOT NULL CHECK (reason IN (
                       'customer_request','kb_missing','bill_received','discount_installment_invoice',
                       'complaint_refund','old_student','misunderstood_3x','asked_if_bot','link_video_voice',
                       'image_limit','ai_quota','validation_failed','ai_error','savings_mode','bank_unapproved',
                       'late_over_23h')),
  detail             text,
  bot_turn_id        bigint REFERENCES app.bot_turns(id) ON DELETE RESTRICT,
  out_of_hours       boolean NOT NULL DEFAULT false,
  assigned_staff_id  uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz,
  resolved_by        text CHECK (resolved_by IS NULL OR resolved_by IN ('tag_removed','return_to_bot','auto_timeout'))
);

-- ---------------------------------------------------------------------------
-- C. BÁN HÀNG
-- ---------------------------------------------------------------------------

-- C1. Phiếu đơn. Đơn KHÔNG tự hủy. Mỗi hội thoại một đơn đang dở (chỉ mục ở 0002).
CREATE TABLE app.orders (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code             text NOT NULL UNIQUE CHECK (order_code ~ '^MGX[A-HJ-NP-Z2-9]{6}$'),  -- bỏ 0/O/1/I
  page_id                uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  conversation_id        uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  customer_id            uuid NOT NULL REFERENCES app.customers(id) ON DELETE RESTRICT,
  customer_name          text,
  phone                  text CHECK (phone IS NULL OR phone ~ '^0[0-9]{9}$'),
  course_codes           text[] NOT NULL DEFAULT '{}',
  offer_code             text,
  list_price_vnd         bigint NOT NULL CHECK (list_price_vnd >= 0),
  amount_vnd             bigint NOT NULL CHECK (amount_vnd >= 0),
  kb_version_id          bigint REFERENCES app.kb_versions(id) ON DELETE RESTRICT,
  status                 text NOT NULL DEFAULT 'awaiting_transfer'
                         CHECK (status IN ('awaiting_transfer','awaiting_confirmation','paid','cancelled')),
  closed_by              text CHECK (closed_by IS NULL OR closed_by IN ('bot','staff')),
  payment_info_sent_at   timestamptz,                 -- "đã gửi STK" = tin chữ gửi thành công
  bill_received_at       timestamptz,
  confirmed_at           timestamptz,
  confirmed_by_staff_id  uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  confirm_channel        text CHECK (confirm_channel IS NULL OR confirm_channel = 'telegram'),  -- GĐ4: bỏ pancake_tag
  telegram_message_id    bigint,                      -- tin S1 trong nhóm sale, để sửa tại chỗ
  cancelled_at           timestamptz,
  cancel_reason          text CHECK (cancel_reason IS NULL OR cancel_reason IN ('staff_removed_tag','course_changed','other')),
  status_before_cancel   text,                        -- GĐ4: gắn lại tag trong 24 giờ → trả về trạng thái này
  restored_at            timestamptz,
  email                  text,
  exported_to            text,
  exported_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- C2. (GĐ4 A8/A8b) Thay đổi trong Sheet cần quản trị bấm xác nhận trên Telegram:
--     STK đổi, thêm quản trị, cấp quyền "Tiền đã về", đổi Telegram ID quản trị, đổi mã nhóm sale.
CREATE TABLE app.sheet_pending_changes (
  id                    bigserial PRIMARY KEY,
  kind                  text NOT NULL CHECK (kind IN ('bank_account','permissions')),
  fingerprint           text NOT NULL,                -- băm nội dung mới, chống hỏi lại cùng một thay đổi
  payload               jsonb NOT NULL,               -- nội dung cũ/mới để hiện trong tin A8/A8b (không SĐT khách)
  kb_version_id         bigint REFERENCES app.kb_versions(id) ON DELETE RESTRICT,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','superseded')),
  telegram_message_id   bigint,
  detected_at           timestamptz NOT NULL DEFAULT now(),
  decided_by_staff_id   uuid REFERENCES app.staff(id) ON DELETE RESTRICT,
  decided_at            timestamptz,
  UNIQUE (kind, fingerprint)
);

-- ---------------------------------------------------------------------------
-- D. THƯ VIỆN MEDIA
-- ---------------------------------------------------------------------------

-- D1. File trong thư mục media/ khớp với tab "Thư viện media". AI chỉ đọc description, send_when.
CREATE TABLE app.media_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     text NOT NULL UNIQUE,                 -- khoa_loai_chude_so
  course_code   text,
  kind          text,
  topic         text,
  description   text,
  send_when     text,
  mime          text,
  size_bytes    bigint,
  file_hash     text,
  status        text NOT NULL DEFAULT 'missing_file'
                CHECK (status IN ('ready','missing_file','missing_description','too_large','disabled')),
  active        boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- D2. Mã Pancake của từng file theo trang (tải trước, gửi bằng mã)
CREATE TABLE app.media_page_uploads (
  asset_id            uuid NOT NULL REFERENCES app.media_assets(id) ON DELETE RESTRICT,
  page_id             uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  pancake_content_id  text,
  uploaded_hash       text,
  uploaded_at         timestamptz,
  last_send_ok_at     timestamptz,
  fail_count          integer NOT NULL DEFAULT 0,
  PRIMARY KEY (asset_id, page_id)
);

-- D3. File đã gửi cho hội thoại nào (khách chưa nhận mới gửi)
CREATE TABLE app.media_deliveries (
  conversation_id  uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  asset_id         uuid NOT NULL REFERENCES app.media_assets(id) ON DELETE RESTRICT,
  bot_turn_id      bigint REFERENCES app.bot_turns(id) ON DELETE RESTRICT,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, asset_id)
);

-- ---------------------------------------------------------------------------
-- E. VẬN HÀNH
-- ---------------------------------------------------------------------------

-- E1. Mỗi lần gọi AI (không lưu nội dung). Giữ 13 tháng.
CREATE TABLE app.ai_calls (
  id                  bigserial PRIMARY KEY,
  page_id             uuid REFERENCES app.pages(id) ON DELETE RESTRICT,
  conversation_id     uuid REFERENCES app.conversations(id) ON DELETE RESTRICT,
  bot_turn_id         bigint REFERENCES app.bot_turns(id) ON DELETE RESTRICT,
  purpose             text NOT NULL CHECK (purpose IN ('reply','summary','image_read')),
  model               text NOT NULL,
  input_tokens        integer NOT NULL DEFAULT 0,
  cache_read_tokens   integer NOT NULL DEFAULT 0,
  cache_write_tokens  integer NOT NULL DEFAULT 0,
  output_tokens       integer NOT NULL DEFAULT 0,
  cost_usd            numeric(12,6) NOT NULL DEFAULT 0,
  cost_vnd            integer NOT NULL DEFAULT 0,
  latency_ms          integer,
  status              text NOT NULL CHECK (status IN ('ok','error','timeout')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- E2. Hành vi lừa bot / spam (giữ 90 ngày)
CREATE TABLE app.abuse_events (
  id               bigserial PRIMARY KEY,
  conversation_id  uuid NOT NULL REFERENCES app.conversations(id) ON DELETE RESTRICT,
  page_id          uuid NOT NULL REFERENCES app.pages(id) ON DELETE RESTRICT,
  kind             text NOT NULL CHECK (kind IN ('injection','ask_system_prompt','code_request','off_topic','flood')),
  matched_rule     text,
  snippet_masked   text CHECK (snippet_masked IS NULL OR char_length(snippet_masked) <= 200),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- E3. Cảnh báo đã gửi (giữ 90 ngày). payload KHÔNG chứa SĐT.
-- kind theo GĐ3 + GĐ4: staff_wait (S11), customer_wait_23h (S9), sheet_change_pending (A8/A8b),
-- daily_report (A12), order_cancelled (S6), tag_removed_awaiting_confirmation (S10), manual_paid_tag (S5).
CREATE TABLE app.alerts (
  id          bigserial PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN (
                'spend_80','spend_over','handoff_rate_30','bot_silent','bot_recovered','kb_invalid','kb_partial',
                'bank_changed','media_issue','error_burst','kb_sync_stale','backup_failed','drive_almost_full',
                'weekly_quality','staff_wait','customer_wait_23h','sheet_change_pending','daily_report',
                'order_cancelled','tag_removed_awaiting_confirmation','manual_paid_tag')),
  page_id     uuid REFERENCES app.pages(id) ON DELETE RESTRICT,
  dedupe_key  text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, dedupe_key)
);
