# AI Agent Chat MagentX

Bot AI trực inbox 24/7 cho MagentX qua Pancake (Facebook, Instagram): tư vấn khóa học Edit video và
Làm video AI, xin số điện thoại, gửi thông tin chuyển khoản, chuyển nhân viên khi cần.

> **Trạng thái:** Giai đoạn 5 – Thiết lập dự án. Bộ khung đã chạy được trên MacBook; chức năng
> tư vấn thật làm ở Giai đoạn 6. Kết quả các phép thử trên tài khoản thật: `docs/ket-qua-thu-nghiem-gd5.md`.

## 1. Thư mục

| Thư mục / file | Dùng để làm gì |
|---|---|
| `CLAUDE.md` | Hướng dẫn cho Claude Code khi làm việc trong kho (bot KHÔNG đọc file này) |
| `docs/` | Tài liệu dự án: PRD, kiến trúc, database, thiết kế, quy trình, quy tắc đặt tên, kết quả thử (bot KHÔNG đọc) |
| `prompts/` | Giọng văn, quy tắc tư vấn cho bot – **nơi duy nhất bot đọc** để biết cách nói |
| `apps-script/` | Mã "người canh" chạy trên Google Apps Script, báo khi bot ngừng (có hướng dẫn riêng) |
| `db/` | Migration database (file SQL đánh số), script tạo tài khoản database |
| `src/` | Mã nguồn bot |
| `scripts/` | Sao lưu, khôi phục thử, các phép thử trên tài khoản thật |
| `tests/` | Kiểm thử tự động |
| `media/` | Ảnh/video gửi cho khách (không đưa lên GitHub) |
| `backups/` | Bản sao lưu mã hóa trên máy (không đưa lên GitHub) |

## 2. Cần có trên MacBook

| Công cụ | Cách kiểm tra | Cài ở đâu |
|---|---|---|
| Node.js bản LTS (≥ 22) | `node --version` | https://nodejs.org (file .pkg) |
| PostgreSQL (Postgres.app) | mở ứng dụng Postgres, thấy chữ Running | https://postgresapp.com |
| Git (Apple Command Line Tools) | `git --version` | gõ `xcode-select --install` trong Terminal |
| ngrok (chỉ giai đoạn thử) | `ngrok version` | https://ngrok.com |

## 3. Cài lần đầu (làm một lần)

Mở Terminal, đi vào thư mục dự án:

```bash
cd ~/dev/magentx-agent-chat
```

1. Tải thư viện:
   ```bash
   npm install
   ```
2. Tạo file cấu hình từ mẫu rồi mở ra điền (TextEdit được, lưu dạng văn bản thuần):
   ```bash
   cp .env.example .env
   ```
   Bắt buộc lúc đầu: `WEBHOOK_SECRET_PATH` (dãy ngẫu nhiên ≥ 24 ký tự), `DATABASE_URL` (đặt mật khẩu
   cho tài khoản `bot_app`), `DATABASE_ADMIN_URL` (tài khoản chủ, với Postgres.app là tên người dùng Mac),
   `BACKUP_PASSWORD` (≥ 12 ký tự, cất một bản trong trình quản lý mật khẩu). Các token khác điền dần.
3. Tạo tài khoản và database trong PostgreSQL (Postgres.app phải đang chạy):
   ```bash
   npm run db:setup
   ```
4. Tạo bảng:
   ```bash
   npm run migrate
   ```
   Chạy lại lệnh này bất cứ lúc nào cũng an toàn: file đã chạy sẽ được bỏ qua.

## 4. Chạy bot

```bash
npm run dev
```

Log sẽ hiện từng khối: Database → Hàng chờ → Web (webhook) → Vòng quét → Telegram → Nhịp tim → Sao lưu.
Khối nào chưa có token trong `.env` sẽ báo "BỎ QUA" và nói rõ thiếu gì; bot vẫn chạy phần còn lại.
Dừng bot: bấm `Ctrl+C` trong Terminal.

Để Pancake gọi được vào bot lúc thử, mở thêm một Terminal khác chạy ngrok:

```bash
ngrok http 3000
```

Địa chỉ webhook dán vào Pancake = địa chỉ ngrok + `/webhook/` + giá trị `WEBHOOK_SECRET_PATH`.

## 5. Lệnh thường dùng

| Lệnh | Làm gì |
|---|---|
| `npm run dev` | Chạy bot, tự khởi động lại khi sửa code |
| `npm run check` | Kiểm tra cú pháp, lint, định dạng (phải qua trước khi commit) |
| `npm test` | Chạy kiểm thử tự động |
| `npm run migrate` | Chạy migration còn thiếu; `npm run migrate -- --status` chỉ xem |
| `npm run db:setup` | Tạo tài khoản `bot_app`, `backup_reader` và database (chạy một lần) |
| `npm run sao-luu` | Sao lưu database ngay (mã hóa, vào `backups/`) |
| `npm run khoi-phuc` | Khôi phục thử bản mới nhất vào database tạm `magentx_khoi_phuc_thu` và so số dòng |
| `npm run thu -- <tên>` | Phép thử trên tài khoản thật (xem `scripts/thu-nghiem/`) |
| `npm run format` | Tự chỉnh định dạng code |

## 6. Sao lưu

Bot tự sao lưu **2 giờ/lần** khi đang chạy: `pg_dump` bằng tài khoản chỉ đọc → nén → mã hóa bằng
`BACKUP_PASSWORD` → `backups/`. Giữ 24 bản gần nhất + bản 3h sáng của 14 ngày. Đẩy lên Google Drive
bật khi có `GOOGLE_SERVICE_ACCOUNT_FILE` và `DRIVE_BACKUP_FOLDER_ID`.
**Mất `BACKUP_PASSWORD` là không mở được bản sao lưu** – luôn giữ một bản trong trình quản lý mật khẩu.

## 7. Người canh (báo khi bot ngừng)

Chạy trên Google Apps Script, dùng bot Telegram "MagentX Canh". Cài theo `apps-script/README.md`.

## 8. Bí mật và an toàn

- Mọi khóa (Claude, Pancake, Telegram, Google, mật khẩu database, mật khẩu sao lưu) chỉ nằm trong
  `.env` trên máy (Git bỏ qua file này) và phần Script Properties của Apps Script. Không bao giờ dán vào chat.
- Lộ khóa nào → vào dịch vụ đó tạo khóa mới, điền lại `.env`, khởi động lại bot, rồi thu hồi khóa cũ.
- PostgreSQL chỉ nhận kết nối từ chính máy. Bật FileVault và mật khẩu máy trước khi có khách thật.

## 9. Khi gặp lỗi

| Thông báo | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `Cấu hình trong file .env chưa đúng` | thiếu/sai biến, có liệt kê tên biến | mở `.env`, đối chiếu `.env.example` |
| `ECONNREFUSED … 5432` | Postgres.app chưa chạy | mở ứng dụng Postgres, bấm Start |
| `permission denied` khi migrate | `DATABASE_ADMIN_URL` không phải tài khoản chủ | sửa `DATABASE_ADMIN_URL` |
| Webhook không tới | ngrok chưa chạy hoặc địa chỉ trong Pancake sai mã | kiểm tra ngrok, dán lại địa chỉ |
| `Không tìm thấy pg_dump` | Postgres.app chưa mở hoặc cài chỗ khác | mở Postgres.app hoặc điền `PG_BIN_DIR` |
