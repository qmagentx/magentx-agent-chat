# Quy tắc đặt tên – AI Agent Chat MagentX

Mục đích: ai mở kho cũng đoán được một file/biến/bảng dùng để làm gì, và Claude Code
đặt tên nhất quán qua các giai đoạn.

## 1. Ngôn ngữ

| Chỗ nào | Ngôn ngữ | Ví dụ |
|---|---|---|
| Tên file, thư mục, biến, hàm trong `src/`, `tests/`, `db/migrate.ts` | Tiếng Anh, không dấu | `src/pancake/webhook.ts`, `sendMessage()` |
| Ghi chú trong code, thông báo log, thông báo lỗi cho người dùng | Tiếng Việt có dấu | `// Chờ ảnh QR tối đa 5 giây` |
| Tài liệu `docs/`, `README.md`, `prompts/`, `apps-script/README.md` | Tiếng Việt có dấu; tên file tiếng Việt không dấu | `docs/quy-tac-dat-ten.md` |
| File SQL migration | Tiếng Việt không dấu, có số thứ tự | `0001_schema_va_bang.sql` |
| Script người dùng tự chạy (`scripts/`) và lệnh npm | Tiếng Việt không dấu | `scripts/sao-luu.ts`, `npm run thu -- webhook` |
| Tên bảng, cột trong database | Tiếng Anh, snake_case (theo thiết kế GĐ3) | `conversations`, `last_customer_message_at` |
| Mã lý do, mã câu mẫu, chỗ trống giá | Theo đúng tài liệu GĐ3/GĐ4 | `gui-stk`, `xac-nhan-bill`, `{gia:edit}` |

## 2. Kiểu chữ

- File và thư mục code: `kebab-case` (`pancake-client.ts`, `order-service.ts`).
- Biến, hàm: `camelCase` (`conversationId`, `buildPrompt`).
- Kiểu dữ liệu, lớp: `PascalCase` (`Conversation`, `PancakeClient`).
- Hằng số cố định: `UPPER_SNAKE_CASE` (`MAX_MEDIA_PER_TURN`).
- Biến môi trường trong `.env`: `UPPER_SNAKE_CASE` (`TELEGRAM_BOT_TOKEN`).
- Bảng, cột database: `snake_case`, tên bảng số nhiều (`orders`, `media_assets`).
- Tên việc trong hàng chờ pg-boss: `kebab-case` theo nhóm (`inbound-message`, `send-stk`).

## 3. Thư mục trong `src/` theo chức năng

Mỗi thư mục là một khối chức năng; không viết cả phần mềm trong một file lớn.

| Thư mục | Nhiệm vụ |
|---|---|
| `config/` | Đọc và kiểm tra cấu hình `.env` |
| `shared/` | Hàm dùng chung: log (che SĐT), chữ tiếng Việt, tiền, thời gian |
| `db/` | Kết nối database, truy vấn theo bảng |
| `queue/` | Hàng chờ pg-boss |
| `pancake/` | Gọi API Pancake, nhận webhook, vòng quét |
| `inbound/` | Nhận tin: chống trùng, gộp tin |
| `gate/` | Cổng chặn (bot tắt, tag, giới hạn) |
| `filter/` | Bộ lọc (bill, link, từ khóa, câu cố định) |
| `brain/` | Gọi AI, dựng hướng dẫn, kiểm tra trả lời |
| `outbound/` | Gửi tin, media, QR, tag, ghi chú |
| `orders/` | Phiếu đơn, mã đơn, STK, hủy/khôi phục |
| `sheet/` | Đồng bộ Google Sheet |
| `telegram/` | Bot Telegram chính: lệnh, nút, tin S1–S11, A1–A13 |
| `alerts/` | Cảnh báo, báo cáo sáng, bảng tuần |
| `heartbeat/` | Nhịp tim ra Apps Script |
| `backup/` | Sao lưu định kỳ |
| `scheduler/` | Lịch chạy định kỳ |

## 4. Migration

- `db/migrations/NNNN_mo-ta-ngan.sql`, bốn chữ số, tăng dần, không bỏ số.
- File đã chạy trên bất kỳ database nào **không sửa**; cần đổi thì thêm file mới.
- Mỗi file bắt đầu bằng ghi chú tiếng Việt: làm gì, vì sao, theo mục nào của tài liệu.

## 5. Commit

- Một dòng tiêu đề tiếng Việt, ≤ 72 ký tự, nói việc đã làm: `Thêm migration 17 bảng theo GĐ3`.
- Dòng trống, rồi mô tả thêm nếu cần (đã thử gì, còn gì chưa).
- Không commit `.env`, `media/`, `backups/`, `node_modules/`.
- Commit ở mốc ổn định: `npm run check` và `npm test` đã qua.

## 6. Nhánh Git

- `main`: luôn ở trạng thái chạy được.
- Việc có rủi ro làm trên nhánh riêng `gd6/ten-chuc-nang`, gộp vào `main` sau khi thử xong.
