# prompts/ – Giọng văn và quy tắc tư vấn của bot

Đây là **nơi duy nhất** bot đọc để biết cách nói chuyện với khách. Bot KHÔNG đọc `docs/`
hay `CLAUDE.md`. Số liệu (giá, ưu đãi, STK, FAQ, câu mẫu) nằm trong Google Sheet, không ở đây.

| File | Nội dung |
|---|---|
| `giong-van.md` | Xưng hô theo trang, giọng điệu, độ dài tin, cách kết câu |
| `quy-tac-tu-van.md` | Quy tắc tư vấn, điều bot được và không được nói |
| `kich-ban-khai-thac.md` | Cách khai thác nhu cầu và xử lý khi khách từ chối (F11–F12) |

## Cách sửa
- Mở file bằng trình soạn thảo chữ thường (TextEdit ở chế độ văn bản thuần, hoặc trên GitHub).
- Giữ nguyên các tiêu đề `##`; chỉ sửa nội dung bên dưới.
- KHÔNG ghi số tiền, số tài khoản, link vào đây. Giá luôn do code điền từ Sheet qua chỗ trống `{gia:…}`.
- Sửa xong, bot đọc lại khi khởi động lại (cách nạp nóng sẽ quyết ở GĐ6).

## Trạng thái
Giai đoạn 5 chỉ tạo **khung** (tiêu đề mục). Nội dung thật do chủ dự án soạn trước GĐ9.
