# CLAUDE.md – AI Agent Chat MagentX

Tài liệu này dành cho Claude Code khi làm việc trong kho. Đọc trước mọi việc.
Bot chat với khách (mã trong `src/`) KHÔNG đọc file này và KHÔNG đọc thư mục `docs/`;
bot chỉ đọc giọng văn/quy tắc tư vấn trong thư mục `prompts/`.

## 1. Dự án là gì

Bot AI trực inbox 24/7 cho MagentX qua Pancake (Facebook MagentX.ai, Instagram MagentX):
tư vấn khóa Edit video và Làm video AI, xin SĐT, gửi thông tin chuyển khoản,
chuyển nhân viên im lặng khi cần. Chủ dự án không biết lập trình, chỉ đọc tiếng Việt.

Giai đoạn hiện tại: **GĐ5 – Thiết lập dự án** (cập nhật dòng này khi đổi giai đoạn).

Công nghệ đã chốt: một ứng dụng TypeScript/Node.js; PostgreSQL trên MacBook; hàng chờ pg-boss;
Claude Haiku 5.5 (`claude-haiku-5-5`) mặc định, Sonnet 5.5 (`claude-sonnet-5-5`) tối đa 5%;
Google Sheet cho số liệu; Telegram (bot chính + bot "MagentX Canh"); người canh Google Apps Script;
ngrok lúc thử. Chi tiết: `docs/Tom-tat-cho-giai-doan-5.md`.

## 2. Thứ tự ưu tiên tài liệu khi có mâu thuẫn

1. `docs/Tom-tat-cho-giai-doan-5.md`
2. `docs/Thiet-ke-giao-dien-giai-doan-4-AI-Agent-Chat-MagentX.md`
3. `docs/Database-va-Google-Sheet-giai-doan-3-AI-Agent-Chat-MagentX.md`
4. `docs/Kien-truc-giai-doan-2-AI-Agent-Chat-MagentX.md`
5. `docs/PRD-cap-nhat-20-11-2026.md`
6. `docs/PRD-AI-Agent-Chat-MagentX-Pancake.md`

Ví dụ: tài liệu cũ nhắc UptimeRobot nhưng đã thay bằng Google Apps Script.
Chỗ nào vẫn không rõ → HỎI chủ dự án, không đoán.
Không đọc cả file tài liệu GĐ2/3/4/PRD; chỉ tìm đúng mục cần theo mục 9 của bản tóm tắt.

## 3. Quy tắc làm việc với chủ dự án

1. Chủ dự án không biết lập trình, chỉ đọc tiếng Việt: giải thích dễ hiểu, hướng dẫn từng bước
   khi cần thao tác trên máy. README, thông báo lỗi cho người dùng, ghi chú trong code: tiếng Việt.
2. Chỉ làm đúng phạm vi giai đoạn đang ở. KHÔNG tự thêm tính năng, KHÔNG tự đổi điều đã chốt ở
   giai đoạn trước. Thấy cần thay đổi → đề xuất và hỏi trước. Mọi thứ làm thay đổi những gì
   chủ dự án hoặc sale nhìn thấy (tin Telegram, tag, ghi chú Pancake, Sheet) đều phải hỏi trước.
3. Không đưa khóa bí mật vào code hay GitHub. Không tạo hoặc thay đổi gì trên Pancake, Telegram,
   Google, Meta, GitHub; không cài phần mềm; không dùng dịch vụ tốn phí khi chưa hỏi.
4. Luôn nói rõ trạng thái: đã viết code / đã kiểm tra cú pháp / đã chạy thử / đã kiểm thử thành
   công / đã triển khai / đã được nghiệm thu. Không báo xong khi chưa kiểm chứng.
5. KHÔNG BAO GIỜ yêu cầu dán khóa bí mật, mật khẩu, token vào khung chat. Khi cần, hướng dẫn
   chủ dự án tự điền vào file `.env` trên máy.
6. Sau mỗi giai đoạn, báo cáo theo mẫu 7 mục (mục 5 dưới) và DỪNG chờ duyệt.
7. **Giải thích trước khi xin phép chạy lệnh.** Trước mỗi lệnh có thể hiện hộp xin phép, viết trong chat
   bằng tiếng Việt đơn giản: (1) lệnh này làm gì, (2) có xóa file, tốn tiền, gửi dữ liệu ra ngoài hoặc
   đụng đến mật khẩu/khóa không, (3) chủ dự án nên bấm nút nào. Dòng mô tả ngắn của lệnh (description)
   cũng viết bằng tiếng Việt. Nếu lệnh liên quan đến **khóa, mật khẩu, xóa file hoặc gửi dữ liệu ra mạng**,
   phải nói rõ bằng chữ **in đậm**.

## 4. Quy tắc bắt buộc khi viết code (không được vi phạm)

- Tin Telegram KHÔNG BAO GIỜ chứa SĐT khách. SĐT không gửi cho AI, không ghi log.
  SĐT chỉ nằm trong database (`customers.phone`, `orders.phone`) và ghi chú Pancake.
- Chuyển nhân viên IM LẶNG; ngoại lệ duy nhất: khách gửi bill → câu mẫu `xac-nhan-bill`.
- Bot không tự giới thiệu là AI, không khẳng định là người; khách hỏi "người hay bot" → chuyển im lặng.
- Tin bot ≤3–4 câu, kết thúc bằng câu hỏi/bước tiếp theo; xưng hô theo trang.
- AI KHÔNG tự viết số tiền/STK: chỉ dùng chỗ trống `{gia:…}` `{gia_goc:…}` `{tiet_kiem:…}`
  `{phan_tram_giam:…}` `{han_uu_dai:…}` `{gia_combo:…}`. AI tự viết số kèm đơn vị tiền
  → không qua kiểm tra → chuyển người. Tiền hiển thị dạng `1.990.000đ`.
- STK + QR do code gửi: 2 tin (ảnh QR → tin chữ theo câu mẫu `gui-stk` có biến `{thong_tin_ck}`).
  Chờ ảnh tối đa 5 giây rồi mới gửi tin chữ; ảnh lỗi vẫn gửi tin chữ. Mỗi đơn gửi STK 1 lần;
  "đã gửi" tính khi tin chữ gửi thành công. Ghi trước, gửi sau.
- Mã đơn `MGX` + 6 ký tự (bỏ 0/O/1/I) = nội dung chuyển khoản. Đơn không tự hủy.
- Meta chỉ cho nhắn trong 24 giờ từ tin cuối của khách. Media gửi trong khung chat, ≤2 file/lượt.
- Nhân viên nhắn tay → bot dừng 24 giờ hoặc đến khi gắn tag "Trả cho bot" (bot tự gỡ tag khi tiếp quản).
- Mỗi hội thoại một việc xử lý tại một thời điểm; không gửi trùng.
- Bí mật (khóa Claude, Pancake, Telegram, Google, mật khẩu sao lưu) chỉ ở `.env` /
  phần bí mật của Apps Script. `.env` nằm trong `.gitignore`.
- Webhook Pancake không có chữ ký → chỉ là "chuông gọi": trước mọi thay đổi đơn/trạng thái bot
  phải đọc lại trạng thái thật qua API Pancake. Địa chỉ webhook có mã bí mật dài; sai mã → bỏ qua, ghi nhật ký.
- Chỉ người có quyền bấm "Tiền đã về" trên Telegram mới xác nhận được đơn; tag "Đã mua" gắn tay chỉ báo (S5).
  Nút bấm chỉ mang mã đơn; quyền kiểm tra lại ở phía bot theo Telegram ID trong tab Nhân viên.
- Làm sạch ký tự đặc biệt trước khi chèn chữ của khách/Sheet vào tin Telegram; tin S1 không được mất
  (gửi lại dạng chữ thường → thử lại theo hàng chờ → báo quản trị). Gửi nhóm ≤20 tin/phút, vượt thì gộp.
- Bot Telegram chính dùng long polling (gọi ra ngoài), không nhận webhook qua ngrok.
- Đọc Sheet bằng giá trị gốc (không phải chữ hiển thị), ngày giờ đổi sang GMT+7, chuẩn hóa tiếng Việt NFC;
  kiểm tra của bot là chốt chặn cuối, quy tắc kiểm tra từng cột viết ở MỘT chỗ. Câu mẫu chứa dãy ≥6 chữ số
  hoặc số tiền ngoài chỗ trống → không hợp lệ, báo A6.
- `/tatbot` xử lý ngay, không xếp hàng; kiểm tra trạng thái tắt ngay trước mỗi lần gửi tin cho khách.
- Hủy đơn chỉ khi: tag "Chờ chuyển khoản" vắng ở 2 lần đọc API cách ≥1 phút, bot không đổi tag trong 2 phút,
  khách không gửi ảnh mới, đơn vẫn Chờ chuyển khoản. Gắn lại trong 24 giờ → khôi phục, không gửi lại STK.
  Gỡ tag "Chờ xác nhận CK" → KHÔNG hủy, báo S10. Đối chiếu tag ↔ đơn 10 phút/lần.
- Ảnh khách gửi trong 7 ngày sau khi nhận STK (kể cả đơn đã hủy) = bill.
- Ghi chú Pancake: dòng "Tóm tắt" ≤150 ký tự, bỏ link và dãy số; chỉ gọi sửa khi nội dung thật sự đổi.
- Nhịp tim ra Apps Script mỗi phút do PHẦN XỬ LÝ TIN gửi (không phải phần web); không chứa dữ liệu khách.
- Chỉ số "chuyển người" và "bot tự xử lý" không tính khách gửi bill.
- Giờ lưu UTC, "một ngày" tính theo giờ Việt Nam. Tiền là số nguyên VND. Đồng bộ Sheet không bao giờ xóa dòng.
- Toàn bộ quy tắc kỹ thuật: mục 13 tài liệu GĐ4. Bảng/cột: GĐ3. Mẫu tin Telegram S1–S11, A1–A13: GĐ4 mục 3–4.

## 5. Quy trình 10 giai đoạn (tóm tắt từ docs/Quy-trinh-lam-viec.md – đọc file gốc khi cần chi tiết)

1. Phân tích yêu cầu → PRD, MVP, tiêu chí nghiệm thu. (XONG)
2. Thiết kế kiến trúc → sơ đồ, công nghệ, lý do. (XONG)
3. Thiết kế database → schema, migration, phân quyền, sao lưu. (XONG)
4. Thiết kế giao diện & trải nghiệm → mẫu tin, luồng, trạng thái lỗi. (XONG)
5. Thiết lập dự án & quản lý code → Git, GitHub (khi được phép), cấu trúc thư mục, README,
   .gitignore, .env.example, quy tắc đặt tên, lint/format. Commit ở mốc ổn định. (ĐANG LÀM)
6. Lập trình từng chức năng theo MVP: giải thích mục tiêu → file cần sửa → ảnh hưởng → viết →
   chạy kiểm tra → sửa lỗi → đối chiếu nghiệm thu → báo cáo → commit.
7. Bảo mật & phân quyền: không lộ khóa, kiểm tra đầu vào, không log dữ liệu nhạy cảm, quyền tối thiểu,
   rà pháp lý dữ liệu cá nhân (Luật BVDLCN 2025).
8. Kiểm thử toàn hệ thống: unit, tích hợp, end-to-end, phân quyền, xử lý lỗi, hiệu năng, sao lưu/khôi phục.
9. Triển khai: hosting, HTTPS, biến môi trường, migration có kiểm soát, sao lưu, giám sát, rollback.
   Không triển khai production khi chưa được phép.
10. Bảo trì: theo dõi lỗi, cập nhật thư viện, phản hồi người dùng, tài liệu.

Nguyên tắc: không làm vượt bước · không tự quyết thay người dùng · không sửa code mù quáng ·
không tuyên bố hoàn thành khi chưa kiểm chứng · không lạm dụng công nghệ.

Mẫu báo cáo cuối mỗi giai đoạn (7 mục): 1. Mục tiêu · 2. Đã thực hiện · 3. Kết quả kiểm tra ·
4. Vấn đề còn tồn tại · 5. Điều kiện chuyển bước · 6. Bước tiếp theo ·
7. Trạng thái (CHƯA BẮT ĐẦU / ĐANG THỰC HIỆN / CHỜ XÁC NHẬN / ĐÃ HOÀN THÀNH).

## 6. Quy ước trong kho

- Code trong `src/`: tên file/thư mục/biến tiếng Anh không dấu (chuẩn lập trình); ghi chú trong code,
  log, thông báo lỗi: tiếng Việt. Tài liệu, README, prompts: tiếng Việt có dấu.
  Chi tiết: `docs/quy-tac-dat-ten.md`.
- Lệnh thường dùng: `npm run dev` (chạy bot), `npm run check` (kiểm tra cú pháp + lint + format),
  `npm test` (unit test), `npm run migrate` (chạy migration), `npm run thu -- <tên>` (phép thử tài khoản thật).
- Trước khi commit: `npm run check` phải qua. Không commit `.env`, `media/`, bản sao lưu.
- Migration: file SQL đánh số trong `db/migrations/`, file đã chạy không sửa, thêm file mới.
