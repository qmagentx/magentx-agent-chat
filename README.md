# AI Agent Chat MagentX

Bot AI trực inbox 24/7 cho MagentX qua Pancake (Facebook, Instagram): tư vấn khóa học,
xin số điện thoại, gửi thông tin chuyển khoản, chuyển nhân viên khi cần.

> Trạng thái: **Giai đoạn 5 – Thiết lập dự án** (đang làm). Phần "Cách chạy" sẽ được
> viết đầy đủ khi bộ khung chạy được.

## Thư mục

| Thư mục / file | Dùng để làm gì |
|---|---|
| `CLAUDE.md` | Hướng dẫn cho Claude Code khi làm việc trong kho (bot KHÔNG đọc file này) |
| `docs/` | Tài liệu dự án: PRD, kiến trúc, database, thiết kế, quy trình (bot KHÔNG đọc) |
| `prompts/` | Giọng văn, quy tắc tư vấn cho bot – **nơi duy nhất bot đọc** để biết cách nói |
| `apps-script/` | Mã "người canh" chạy trên Google Apps Script, báo khi bot ngừng |
| `db/` | Migration database (file SQL đánh số) và script tạo tài khoản database |
| `src/` | Mã nguồn bot |
| `scripts/` | Sao lưu, khôi phục, các phép thử trên tài khoản thật |
| `tests/` | Kiểm thử tự động |
| `media/` | Ảnh/video gửi cho khách (không đưa lên GitHub) |
| `backups/` | Bản sao lưu tạm trên máy (không đưa lên GitHub) |

## Cần có trên MacBook

- Node.js bản LTS (≥ 22)
- PostgreSQL (Postgres.app)
- Git
- ngrok (giai đoạn thử nghiệm)

Hướng dẫn cài và chạy từng bước: sẽ bổ sung trong giai đoạn 5.

## Bí mật

Mọi khóa bí mật (Claude, Pancake, Telegram, Google, mật khẩu sao lưu) chỉ nằm trong file `.env`
trên máy. File này đã được loại khỏi Git. Mẫu các biến cần điền: `.env.example`.
