# Tóm tắt đầu vào cho Giai đoạn 5 – Thiết lập dự án và quản lý code

Ngày: 21/11/2026. Bản rút gọn từ GĐ1–4 (GĐ4 đã được người dùng xác nhận 21/11/2026). GĐ5 làm bằng **Claude Code trên kho GitHub**. Khi cần chi tiết, tìm đúng mục ở cuối tài liệu này, không đọc lại cả tài liệu.

## 1. Sản phẩm
Bot AI trực inbox 24/7 cho MagentX qua Pancake (Facebook MagentX.ai, Instagram MagentX): tư vấn khóa Edit video và Làm video AI, xin SĐT, gửi thông tin chuyển khoản, chuyển nhân viên im lặng khi cần. 200–500 hội thoại mới/ngày khi chạy quảng cáo, 2–3 sale, giờ trực 8h–22h. Chủ dự án không biết lập trình, chỉ đọc tiếng Việt → mọi hướng dẫn, README, thông báo lỗi cho người dùng viết tiếng Việt dễ hiểu.

## 2. Công nghệ đã chốt
- **Một ứng dụng TypeScript/Node.js** duy nhất: nhận webhook Pancake (+ vòng quét 30 giây), lọc, gọi Claude (Haiku 5.5 mặc định, Sonnet 5.5 ≤5%), kiểm tra, gửi lại qua API Pancake.
- **PostgreSQL** chạy trên MacBook giai đoạn đầu; hàng chờ **pg-boss**. Không Redis, không vector DB. Sau mốc chất lượng 14 ngày → Railway + Supabase Pro (Singapore).
- Đường vào: **ngrok** lúc thử → Cloudflare Tunnel + tên miền khi chạy khách thật.
- **Google Sheet** "MagentX – Kho kiến thức Bot" (12 tab) cho số liệu; file `.md` trong kho code cho giọng văn, quy tắc tư vấn. Bot đọc Sheet 5 phút/lần, quyền Xem.
- **Telegram**: bot chính (cảnh báo, nhóm sale, nút "Tiền đã về", lệnh quản trị) + **bot "MagentX Canh"** (đã chốt 21/11) chỉ để báo ngừng.
- **Người canh Google Apps Script** (thay UptimeRobot): **bot đẩy nhịp tim ra Apps Script mỗi phút** (kèm số việc đang chờ, tin chưa trả lời lâu nhất; không dữ liệu khách). Apps Script kiểm 5 phút/lần, 2 lần liên tiếp trễ → báo quản trị (24/7) + nhóm sale (8h–22h); tự gửi cả S7 và S8. Không dùng địa chỉ kiểm tra sức khỏe công khai.
- Bot Telegram chính dùng **long polling** (gọi ra ngoài), không nhận webhook qua ngrok (ngrok miễn phí chỉ 20.000 lượt/tháng).
- QR: VietQR qua qr.sepay.vn. Sao lưu: mỗi 2 giờ, mã hóa, lên Google Drive.

## 3. GĐ5 cần làm (theo quy trình dự án)
1. Tạo kho GitHub riêng tư (khi người dùng cho phép), khởi tạo Git.
2. Cấu trúc thư mục tách theo chức năng (gợi ý): nhận tin Pancake · bộ lọc/cổng chặn · gọi AI + kiểm tra chỗ trống giá · gửi tin/media · đơn hàng · đồng bộ Sheet · Telegram · cảnh báo/báo cáo · sao lưu · database (migration) · `prompts/` (.md giọng văn) · `apps-script/` (người canh) · `docs/`.
3. README tiếng Việt (cách chạy trên MacBook từng bước), `.gitignore`, `.env.example` không chứa bí mật, quy tắc đặt tên, lint + format.
4. Migration database theo GĐ3 (bao gồm thay đổi của GĐ4 ở mục 6 dưới đây).
5. Chạy được bộ khung trên MacBook; commit ở mốc ổn định.
6. **Đầu GĐ5 làm các phép thử trên tài khoản thật** (mục 7) trước khi viết chức năng phụ thuộc vào chúng.

## 4. Quy tắc bắt buộc (không được vi phạm khi viết code)
- Tin Telegram **không bao giờ chứa SĐT khách**. SĐT không gửi cho AI, không ghi log. SĐT chỉ nằm trong database và ghi chú Pancake.
- Chuyển nhân viên **im lặng**; ngoại lệ duy nhất: khách gửi bill → câu mẫu `xac-nhan-bill`.
- Bot không tự giới thiệu là AI, không khẳng định là người; khách hỏi "người hay bot" → chuyển im lặng.
- Tin bot ≤3–4 câu, kết thúc bằng câu hỏi/bước tiếp theo; xưng hô theo trang.
- **AI không tự viết số tiền/STK**: chỉ dùng chỗ trống `{gia:…}` `{gia_goc:…}` `{tiet_kiem:…}` `{phan_tram_giam:…}` `{han_uu_dai:…}` `{gia_combo:…}`; AI tự viết số kèm đơn vị tiền → không qua kiểm tra → chuyển người. Tiền hiển thị `1.990.000đ`.
- STK + QR do code gửi: **2 tin** (ảnh QR → tin chữ theo câu mẫu `gui-stk` có biến `{thong_tin_ck}`). Mỗi đơn chỉ gửi STK 1 lần; "đã gửi" tính khi tin chữ gửi thành công. Ghi trước, gửi sau.
- Mã đơn `MGX` + 6 ký tự (bỏ 0/O/1/I) = nội dung CK. Đơn không tự hủy.
- Meta chỉ cho nhắn trong 24 giờ từ tin cuối của khách. Media gửi trong khung chat, ≤2 file/lượt.
- Nhân viên nhắn tay → bot dừng 24 giờ hoặc đến khi gắn "Trả cho bot".
- Mỗi hội thoại một việc xử lý tại một thời điểm; không gửi trùng.
- Bí mật (khóa Claude, Pancake, Telegram, Google, mật khẩu sao lưu) chỉ ở `.env` / phần bí mật của Apps Script, không đưa lên GitHub.
- **Webhook Pancake không có chữ ký → chỉ là chuông gọi**: trước mọi thay đổi đơn/trạng thái bot phải đọc lại trạng thái thật qua API Pancake. Địa chỉ webhook có mã bí mật.
- **Chỉ người có quyền bấm "Tiền đã về" trên Telegram mới xác nhận được đơn**; tag "Đã mua" gắn tay chỉ báo.
- Làm sạch ký tự đặc biệt trước khi chèn chữ của khách/Sheet vào tin Telegram; tin S1 không được mất (gửi lại dạng chữ thường, thử lại, báo quản trị).
- Đọc Sheet bằng giá trị gốc (không phải chữ hiển thị), chuẩn hóa tiếng Việt NFC, kiểm tra của bot là chốt chặn cuối; câu mẫu chứa dãy ≥6 chữ số hoặc số tiền ngoài chỗ trống → không hợp lệ.
- `/tatbot` xử lý ngay, không xếp hàng; kiểm tra trạng thái tắt ngay trước mỗi lần gửi tin.
- Chỉ số "chuyển người" và "bot tự xử lý" **không tính khách gửi bill**.
- Toàn bộ quy tắc kỹ thuật: mục 13 tài liệu GĐ4.

## 5. Giao diện đã thiết kế (GĐ4) – mã để tham chiếu khi code
- Tin nhóm sale: S1 bill chờ xác nhận + nút · S2 đã xác nhận · S3 bấm trùng · S4 không có quyền · S5 có người gắn tag Đã mua (chỉ báo) · S6 hủy đơn · S7 bot ngừng · S8 bot chạy lại (cả hai do người canh gửi) · S9 khách chờ quá 23 giờ · S10 tag "Chờ xác nhận CK" bị gỡ · S11 khách chờ sale quá 15 phút (chỉ trong giờ trực).
- Thêm A8b: đổi quyền/nơi nhận tin trong Sheet (thêm Quản trị, cấp quyền "Tiền đã về", đổi Telegram ID quản trị, đổi mã nhóm sale) phải bấm xác nhận.
- Tin quản trị: A1–A2 chi phí · A3 chuyển người >30% (chỉ khi ≥20 hội thoại) · A4 bot ngừng · A5 khôi phục · A6 Sheet lỗi · A7 đồng bộ lâu · A8 STK đổi + nút · A9 media · A10 sao lưu · A11 lỗi dồn dập · A12 báo cáo 8h00 · A13 chất lượng tuần thứ Hai 8h00 + nút "Đã đọc 30 hội thoại".
- Lệnh (chỉ quản trị, chat riêng): `/start` `/huongdan` `/tatbot` (bấm là tắt ngay) `/batbot` (chỉ trả lời tin mới) `/trangthai` `/baocao`. Người lạ nhắn → không trả lời.
- Nguyên tắc: dòng đầu nói hết ý; 🔴🟡🟢💰📊⛔⚪; ≤12 dòng; xử lý xong sửa chính tin cũ; 22h–8h gửi im lặng.
- Pancake: 13 tag có màu (đỏ/cam/vàng = cần làm; xanh lá = xong); 1 ghi chú bot/khách, bot sửa tại chỗ (SĐT, quan tâm, tóm tắt, đơn, trạng thái, lý do chuyển sale, đơn cũ).
- Sheet mẫu: màu tab (đỏ quan trọng, xanh phụ), dropdown, tô màu lỗi, dòng ví dụ Dùng = Không, tab Đọc trước 12 điều.

## 6. Thay đổi GĐ4 cần đưa vào migration / code
- Hủy đơn khi nhân viên gỡ tag "Chờ chuyển khoản"; gắn lại trong 24 giờ → khôi phục đơn cũ, không gửi lại STK. Bot tự gỡ tag không tính là hủy. Chỉ hủy khi: tag vắng ở 2 lần đọc API cách ≥1 phút, bot không đổi tag trong 2 phút, khách không gửi ảnh mới, đơn vẫn Chờ chuyển khoản. Đối chiếu tag ↔ đơn 10 phút/lần.
- Ảnh khách gửi trong 7 ngày sau khi nhận STK (kể cả đơn đã hủy) = bill; người có quyền bấm "Tiền đã về" mở lại đơn đã hủy thành Đã thanh toán.
- Bỏ `confirm_channel = pancake_tag`; thêm bảng thay đổi Sheet chờ duyệt (STK + quyền/nơi nhận tin).
- Thêm 2 dòng Cài đặt chung: phút chờ sale trước khi nhắc (15), số ngày coi ảnh là bill (7).
- Gỡ tag "Chờ xác nhận CK" → **không hủy**, đơn giữ Chờ xác nhận, bot báo nhóm sale (tin S10, trả lời vào tin S1); bot không tự gắn lại tag.
- Biến `{thong_tin_ck}` trong `gui-stk`.
- 7 dòng mới ở tab Cài đặt chung: giờ báo cáo sáng, ngày bảng tuần, số hội thoại tối thiểu để cảnh báo chuyển người, ngưỡng đồng bộ lâu, thời gian khôi phục đơn, giờ im lặng, mã nhóm Telegram sale.
- Bot tự gỡ tag "Trả cho bot" khi tiếp quản.
- Lưu ngày người dùng bấm "Đã đọc 30 hội thoại".
- Bỏ UptimeRobot; thêm thư mục Apps Script người canh (nhận nhịp tim, kiểm 5 phút/lần, gửi A4/S7/S8 bằng bot "MagentX Canh"); bot gửi nhịp tim từ phần xử lý tin.

## 7. Phép thử trên tài khoản thật (đầu GĐ5)
Từ GĐ2: webhook Pancake + độ trễ; webhook có báo tin nhân viên không · phân biệt tin bot/nhân viên/trả lời tự động quảng cáo · ảnh QR SePay hiển thị trên Messenger và Instagram · giới hạn gọi API, lỗi ngoài 24 giờ · tải trước media lên Pancake, gửi bằng mã · ngrok ổn định qua đêm · tắt/bật bot nhặt đủ tin sót, không gửi trùng · sao lưu và khôi phục.
Từ GĐ4: webhook có báo gắn/gỡ tag và ai gỡ · API lọc hội thoại theo tag · webhook đặt được địa chỉ có mã bí mật · API sửa được ghi chú đã có · mẫu link mở hội thoại Pancake · nhịp tim tới Apps Script mỗi phút ổn định, trong hạn mức miễn phí · thông báo nhỏ khi bấm nút Telegram trên điện thoại.

## 8. Người dùng chuẩn bị
Fanpage thử nghiệm, khóa Claude API, tài khoản GitHub, nhóm Telegram cho sale, ngrok, Google Drive chứa sao lưu (bật 2FA). Thêm từ GĐ4: tạo 2 bot Telegram qua BotFather (bot chính + "MagentX Canh") khi GĐ5 hướng dẫn. Chưa cần Supabase.

## 9. Cần chi tiết thì đọc ở đâu
- Bảng, cột, trạng thái, mã lý do, loại cảnh báo, khôi phục, phân quyền DB: `claude/Database-va-Google-Sheet-giai-doan-3-AI-Agent-Chat-MagentX.md`.
- Luồng 9 bước, quyết định kiến trúc, thư viện media, kết quả xác minh Pancake: `claude/Kien-truc-giai-doan-2-AI-Agent-Chat-MagentX.md`.
- Mẫu từng tin Telegram, lệnh, tag, ghi chú, Sheet mẫu: `claude/Thiet-ke-giao-dien-giai-doan-4-AI-Agent-Chat-MagentX.md` (mục 3–9).
- Hành trình khách, tình huống chuyển người, tiêu chí nghiệm thu: `claude/PRD-AI-Agent-Chat-MagentX-Pancake.md` + `claude/PRD-cap-nhat-20-11-2026.md`.
