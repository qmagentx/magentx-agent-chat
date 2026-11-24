# Kiến trúc hệ thống – AI Agent Chat MagentX (Phương án B)

Ngày: 19/11/2026 (cập nhật 20/11, chỉnh theo giai đoạn 3) · Giai đoạn 2 · Trạng thái: ĐÃ HOÀN THÀNH (người dùng xác nhận ngày 20/11/2026). Giai đoạn 3 cũng đã hoàn thành ngày 20/11/2026.
Bản đầy đủ (có sơ đồ, có thể đã được sửa sau; chưa cập nhật các thay đổi giai đoạn 3 bên dưới): https://claude.ai/artifact/617xknQL8UxJZ3gPm1c5HY
PRD đã cập nhật theo kiến trúc và database: xem `claude/PRD-cap-nhat-20-11-2026.md` (bản sống: https://claude.ai/artifact/Rvrvb2r8H1txLZZ7BhinJK).
Thiết kế database & Google Sheet: `claude/Database-va-Google-Sheet-giai-doan-3-AI-Agent-Chat-MagentX.md`. Trạng thái các giai đoạn: `claude/Trang-thai-du-an.md`.

## Thay đổi từ giai đoạn 3 (người dùng quyết định ngày 20/11/2026)
- **Quyết định 1 đổi:** database PostgreSQL chạy **trên MacBook** cả lúc thử lẫn thời gian đầu chạy khách thật (dự kiến 10–30 ngày, đến khi đạt mốc chất lượng 14 ngày liên tiếp; chuyển sớm nếu Mac trục trặc hoặc quá 60 ngày). Khi đạt mốc: chuyển ứng dụng lên Railway và database lên Supabase Pro (Singapore) cùng một đêm, sau 2–3 ngày tập dượt. Không dùng Supabase Free.
- Điều kiện trước khi có khách thật trên Mac: FileVault, database chỉ mở trong máy, sao lưu mã hóa **mỗi 2 giờ** lên Google Drive (giữ 24 bản + bản 3h sáng của 14 ngày), đã thử khôi phục.
- Khôi phục sau khi bot ngừng: nhặt lại tin sót; tin chờ dưới 30 phút trả lời bình thường, 30 phút–23 giờ trả lời kèm câu xin lỗi muộn, quá 23 giờ chuyển sale. Bot ngừng trong giờ trực → báo nhóm sale và người được chọn (vd manager).
- Nhật ký tin nhắn giữ **90 ngày** (thay 180).
- AI không tự viết số tiền: chỉ viết chỗ trống, code điền giá từ Sheet.
- Không tự hủy đơn: gửi STK xong gắn tag **"Chờ chuyển khoản"**.
- STK trong Sheet bị đổi → giữ STK đã duyệt đến khi quản trị xác nhận trên Telegram.
- Sheet có 12 tab: thêm Đọc trước, Từ khóa, Nhân viên, Cài đặt chung.

## Tóm tắt
Một ứng dụng nhỏ duy nhất (TypeScript/Node.js) nhận tin từ Pancake, lọc rồi mới gọi AI, kiểm tra câu trả lời rồi gửi lại qua API Pancake. Giai đoạn đầu ứng dụng **và database PostgreSQL** đều chạy trên MacBook của người dùng; đạt mốc chất lượng thì chuyển ứng dụng ra Railway và database lên Supabase Pro. Pancake là cổng duy nhất; nhân viên vẫn làm việc trên Pancake; bot chỉ có quyền gửi tin, gắn tag, ghi chú, phân công. Không Redis, không vector DB.

## Quyết định
| # | Quyết định | Nội dung | Trạng thái |
|---|---|---|---|
| 1 | Nơi chạy | MacBook trước cho cả ứng dụng và database PostgreSQL (ngrok lúc thử, Cloudflare Tunnel khi đã mua tên miền); đạt mốc chất lượng → ứng dụng lên Railway, database lên Supabase Pro (Singapore) | Đã chốt (sửa 20/11 ở GĐ3) |
| 2 | Mô hình AI | Haiku 5.5 mặc định; Sonnet 5.5 khi tư vấn sâu, tối đa 5% | Đã chốt |
| 3 | Nơi sửa kiến thức | Google Sheet cho số liệu (giá, ưu đãi, STK, FAQ, thư viện media, nhân viên, cài đặt); file .md trong kho code cho giọng văn, quy tắc tư vấn | Đã chốt |
| 4 | Cảnh báo, điều khiển | Telegram: cảnh báo người dùng + nhóm sale nhận đơn (không kèm SĐT) và bấm "Tiền đã về" | Đã chốt |
| 5 | Chạy thử | Không dùng chế độ Nháp: toàn bộ thử nghiệm trên fanpage thử nghiệm riêng, bot gửi thật | Đã chốt |
| 6 | Trang kiểm thử | Fanpage thử nghiệm riêng | Đã chốt |
| 7 | Gộp tin | Chờ 4 giây sau tin cuối, tối đa 12 giây; câu hỏi trọn ý trả lời sớm (~2 giây); khách gõ thêm thì soạn lại | Đã chốt |
| 8 | Giới hạn mỗi khách | 30 lượt trả lời bằng AI/khách/ngày (chỉ đếm lượt bot trả lời bằng AI); quá 20 tin/phút thì tạm dừng | Đã chốt |
| 9 | Chuyển nhân viên | Im lặng hoàn toàn, kể cả ngoài giờ. Ngoại lệ: khách gửi bill → 1 câu xác nhận nghe như người. Tin thoại → chuyển ngay. Cảnh báo khi tỷ lệ chuyển người >30%/ngày | Đã chốt |
| 10 | Ảnh, link, video, thoại | Đọc tối đa 3 ảnh/hội thoại bằng Haiku; link, video, tin thoại, ảnh thứ 4+ → chuyển nhân viên im lặng; ảnh bill sau khi gửi STK không tính | Đã chốt |
| 11 | Thư viện media | Thư mục trên MacBook + tab "Thư viện media" trong Sheet + tải trước lên Pancake, gửi bằng mã | Đã chốt |
| 12 | Nơi ghi đơn học viên | Chưa chọn (công ty đang kiểm tra); MVP lưu database + ghi chú Pancake | Chờ |
| 13 | Trả lời bình luận, mô hình dự phòng (OpenAI/Gemini) | P2 | Đã chốt |
| 14 | Khách từ quảng cáo có câu trả lời tự động | Giữ câu trả lời tự động của Meta; bot chờ khách nhắn tiếp; tự hiểu khóa từ hội thoại, không dùng bảng mã quảng cáo → khóa | Đã chốt |
| 15 | Sao lưu | Mỗi 2 giờ, mã hóa, lên Google Drive; thử khôi phục 2 tuần/lần | Đã chốt (GĐ3) |

## Thay đổi so với PRD (đã cập nhật vào PRD ngày 20/11)
- Mục tiêu dưới 5 giây đo từ tin cuối cùng khách gửi trong lượt.
- Chuyển nhân viên: bot không nhắn gì cho khách; ngoại lệ bill có 1 câu xác nhận.
- Khách hỏi "bạn là người hay bot"/"bạn là AI gì" → chuyển nhân viên im lặng. Bot không tự giới thiệu là AI, không bao giờ khẳng định là người (bước kiểm tra chặn câu nói dối này).
- Chạy thử toàn bộ trên fanpage thử nghiệm riêng, không dùng chế độ Nháp.
- Thêm: thư viện media, quy tắc ảnh/link/video/thoại, phiếu đơn + luồng Telegram cho sale, trí nhớ 3 lớp, cảnh báo tỷ lệ chuyển người 30%.

## Thành phần
1. Pancake (dịch vụ có sẵn; giữ file media đã tải lên)
2. Cổng nhận tin: webhook có mã bí mật trên URL, vòng quét dự phòng 30 giây, chống trùng
3. Hàng chờ: pg-boss trong Postgres, gộp tin 4/12 giây, thử lại khi lỗi
4. Bộ não hội thoại: cổng chặn, bộ lọc, trí nhớ 3 lớp, tra kiến thức, gọi AI, chọn media, kiểm tra trước khi gửi
5. Bộ thực thi: gửi tin, media (bằng mã Pancake), ảnh QR, tag, ghi chú, phân công xoay vòng
6. Đồng bộ + lịch chạy: Sheet 5 phút/lần; đối chiếu thư mục media với Sheet và tải file mới lên Pancake; báo cáo sáng; kiểm tra sức khỏe; sao lưu 2 giờ/lần
7. PostgreSQL (trên MacBook; sau chuyển lên Supabase Pro): trạng thái, hồ sơ khách, phiếu đơn, nhật ký, bảng "tên file ↔ mã Pancake", chi phí AI, bộ đếm, hàng chờ
8. Dịch vụ ngoài: Claude API, Google Sheet, Google Drive (bản sao lưu), Telegram, VietQR (qr.sepay.vn), UptimeRobot, đường hầm ngrok/Cloudflare khi chạy trên Mac

Google Sheet chia 12 tab: Đọc trước · Khóa học · Ưu đãi · FAQ · Chính sách · Chuyển khoản · Câu mẫu (gồm câu trả lời tự động của quảng cáo) · Thư viện media · Từ khóa · Cài đặt trang · Nhân viên · Cài đặt chung. File .md trong kho code: giọng văn, xưng hô, quy tắc tư vấn, kịch bản khai thác/xử lý từ chối (F11–F12).

## Luồng 9 bước
Nhận webhook (chỉ là tín hiệu, đọc lại qua API) → chống trùng → gộp tin (4 giây, tối đa 12) → cổng chặn (bot tắt, hoặc chế độ Thử nghiệm mà hội thoại không có tag "Thử bot"; tag Cần người/Khách rác/Chờ xác nhận CK/Đã mua; nhân viên vừa nhắn; hết 30 lượt AI; >20 tin/phút; chế độ tiết kiệm) → bộ lọc (sticker; ảnh bill sau khi gửi STK → tag Chờ xác nhận CK + báo Telegram sale + 1 câu xác nhận cho khách; link/video/thoại/ảnh thứ 4+ → chuyển im lặng; từ khóa cần người và "bạn là người hay bot" → chuyển im lặng; câu lừa bot → câu từ chối mẫu, 3 lần → Khách rác; câu cố định → câu mẫu) → gọi AI (hướng dẫn lưu đệm + kiến thức liên quan + mô tả media + trí nhớ 3 lớp; SĐT thay bằng ký hiệu; giá chỉ dưới dạng chỗ trống) → kiểm tra (chỗ trống giá hợp lệ, không tự viết số tiền, STK, link, code, ≤4 câu, không tự nhận là người, media hợp lệ ≤2 file/lượt; sai → chuyển im lặng) → thực thi (điền giá, gửi STK bằng câu mẫu, tag "Chờ chuyển khoản") → ghi sổ.
Thời gian đo từ tin cuối của khách; khoảng chờ 4 giây có thể làm tổng vượt 5 giây → quyết sau khi có số đo (rút còn 3 giây hoặc nới mục tiêu 7 giây).

## Khách đến từ quảng cáo có câu trả lời tự động
- Khách bấm câu hỏi mẫu trong quảng cáo → Meta tự trả lời → bot không nhắn thêm, chờ khách nhắn tin tiếp theo. Thông báo "khách mới" trên Pancake không ảnh hưởng bot.
- Khi khách nhắn tiếp, bot coi câu hỏi mẫu + câu trả lời tự động là phần "đã nói", không nhắc lại, tự hiểu khách quan tâm khóa nào từ hội thoại. Không dùng bảng ghép mã quảng cáo → khóa học.
- Bắt buộc: phân biệt tin tự động của Meta với tin nhân viên gõ tay; nếu nhầm, bot im lặng 24 giờ với khách từ quảng cáo. Dự phòng nếu dữ liệu Pancake không phân biệt được: so nội dung với danh sách câu trả lời tự động của quảng cáo (tab Câu mẫu), hoặc chỉ coi là nhân viên khi tin có tên nhân viên gửi.
- Vận hành: câu trả lời tự động trong quảng cáo không tự cập nhật theo Sheet; đổi giá/ưu đãi thì sửa cả quảng cáo.

## Trí nhớ 3 lớp
Hồ sơ khách tóm tắt (AI cập nhật trong lần trả lời) + 10 tin gần nhất + tóm tắt phần cũ (cứ ~10 tin gọi Haiku viết lại). Token gần như không tăng theo độ dài hội thoại.

## Thư viện ảnh/video
- Thư mục MacBook (sau: Supabase Storage riêng tư), chia theo khóa/loại; tên file `khoa_loai_chude_so` (vd edit_feedback_lam-nghe_01.jpg).
- Tab "Thư viện media" trong Sheet = danh sách file được phép gửi: tên file (khớp thư mục), nội dung file, gửi khi nào. File không có dòng trong Sheet thì bỏ qua.
- Chuẩn bị: bot đối chiếu 5 phút/lần, nén ảnh >500 KB, tải lên Pancake một lần, lưu mã; báo Telegram khi xong hoặc khi thiếu mô tả/thiếu file/video >15 MB.
- Khi chat: AI đọc mô tả (chỉ chữ ~300 token), chọn tên file; code kiểm tra (có trong thư viện, khách chưa nhận, ≤2 file/lượt) rồi gửi bằng mã Pancake. Khách nhận file trong khung chat, không có link. AI không nhìn ảnh, không trả lời theo ảnh.
- Thay file cùng tên → tải lại; xóa dòng mô tả → ngừng gửi; trang mới → tự tải lại (mã tính theo trang).
- Cần thử GĐ5: upload qua API công khai (công cụ Pancake đang kết nối: ảnh ≤500 KB, video ≤15 MB). Không được thì gửi qua link tạm có mã bí mật, sống vài phút, chỉ Pancake dùng.

## Trạng thái hội thoại
Mới → Tìm hiểu nhu cầu → Tư vấn → Xin liên hệ → Đã gửi thông tin CK (mã đơn riêng, ví dụ MGX7K2Q9; tag Chờ chuyển khoản; không tự hủy) → Chờ xác nhận CK → Đã mua; ngoài ra Cần người, Khách rác. (Trạng thái thanh toán lưu ở phiếu đơn.)
Nhân viên nhắn tay → bot dừng 24 giờ (cài đặt được) hoặc đến khi gắn tag "Trả cho bot".
3 chế độ mỗi trang: Tắt / Thử nghiệm (chỉ hội thoại có tag "Thử bot", dùng khi đưa bot sang trang thật) / Bật. Không dùng chế độ Nháp.

## Ghi đơn học viên
- MVP: phiếu đơn trong database (mã đơn, tên, SĐT, khóa, số tiền, ưu đãi, trang, thời điểm, nguồn chốt, ô trống email, ô "đã xuất ra đâu/lúc nào"); trạng thái Chờ chuyển khoản → Chờ xác nhận → Đã thanh toán/Hủy (chỉ hủy khi khách đổi khóa hoặc nhân viên hủy).
- Luồng Telegram MVP: bill → tag Chờ xác nhận CK + ghi chú Pancake + 1 câu xác nhận nghe như người cho khách → tin vào nhóm Telegram sale (tên, khóa, số tiền, mã đơn, link hội thoại; không SĐT; nút "Tiền đã về") → sale bấm → tag Đã mua (+ Bot chốt), cập nhật ghi chú, ghi người/giờ xác nhận. Gắn tag Đã mua trực tiếp trên Pancake cũng được. Chỉ sale trong danh sách bấm được nút; bấm trùng không ghi đè.
- Sau khi chọn nơi ghi: thêm nút "Bot ghi"/"Sale tự ghi"; module "nơi ghi đơn" thêm 1 dòng/đơn, lỗi thử lại + báo Telegram, ghi chú Pancake "Đã ghi đơn…". Chưa tạo Sheet Đơn hàng (công ty đang kiểm tra nơi ghi, cột, thông tin vào học).

## Chi phí (1 USD = 26.500 đ)
- Khi chạy trên MacBook (cả thử và khách thật thời gian đầu): database 0 đ (PostgreSQL trên Mac), không tốn Railway; ngrok miễn phí; Google Drive miễn phí (sao lưu); tên miền ~300.000–800.000 đ/năm khi chạy khách thật.
- Khi ra máy chủ thuê: Railway 5–15 USD + Supabase Pro 25 USD ≈ 0,8–1,1 triệu/tháng.
- AI: 200 hội thoại/ngày, 6 lần gọi, 5% Sonnet ≈ 0,96 triệu; 500/ngày ≈ 2,4 triệu; xấu nhất ≈ 5,0 triệu. Tổng (máy chủ thuê) 1,8–3,5 triệu; xấu nhất ≈ 6,1 triệu. Chưa tính tóm tắt hội thoại + đọc ảnh: thêm ~10% phần AI, vẫn trong ngân sách.
- Đọc ảnh: ~1.000–1.600 token/ảnh, dưới 5 đồng/ảnh với Haiku 5.5.
- Giá Claude: Haiku 5.5 0,10/0,50 USD mỗi triệu token (đọc đệm 0,01); Sonnet 5.5 2/10 USD (đọc đệm 0,10).
- Hạn mức đề xuất: AI 3 triệu/tháng, 100.000 đ/ngày; 80% báo Telegram; vượt → ngừng Sonnet rồi chế độ tiết kiệm.
- Tham khảo mô hình khác (P2): GPT-6 Luna 0,10/0,50; GPT-6.1 Terra 1/5; Gemini 2.5 Flash-Lite 0,10/0,40; Gemini 3.1 Flash-Lite 0,25/1,50.

## Vận hành
- MacBook 24/7: luôn cắm sạc, mở nắp hoặc gập khi có màn hình ngoài, không tự ngủ khi cắm sạc, hoãn cập nhật macOS tự động, ứng dụng + PostgreSQL + đường hầm tự chạy khi khởi động, FileVault (khởi động lại bất ngờ cần người gõ mật khẩu trên Mac). UptimeRobot báo Telegram khi bot không phản hồi; vòng quét nhặt tin sót; khôi phục theo mục 5 tài liệu database.
- Không dùng bộ lưu điện cho modem (người dùng chấp nhận bot ngừng khi mất điện/mạng).
- Lỗi Pancake/Claude: thử lại 3 lần; vẫn lỗi hoặc Claude >8 giây → chuyển nhân viên im lặng.
- Cảnh báo Telegram thêm: tỷ lệ chuyển nhân viên >30% số hội thoại trong ngày, kèm số lần theo từng lý do; bot ngừng trong giờ trực → báo nhóm sale + người được chọn; sao lưu lỗi. Tin Telegram không bao giờ chứa SĐT khách.
- Lộ trình nơi chạy: thử nghiệm toàn bộ trên fanpage thử nghiệm riêng (Mac + PostgreSQL trên Mac, ngrok) → 9a khách thật trên Mac (PostgreSQL trên Mac + sao lưu 2 giờ, Cloudflare Tunnel + tên miền, Thử nghiệm → Bật) → đạt mốc chất lượng 14 ngày → 9b tập dượt 2–3 ngày rồi chuyển ứng dụng lên Railway và database lên Supabase Pro cùng một đêm, media lên Supabase Storage.
- Cảnh báo "bot ngừng trả lời" không tính hội thoại đã chuyển nhân viên.

## Kết quả xác minh Pancake
- API công khai đủ cho F1–F6: hội thoại (60/lần, lọc tag, recent_phone_numbers, last_sent_by, ad_ids), tin nhắn (30/lần), gửi tin + ảnh qua content_url, tag, phân công, danh sách nhân viên. Trả lời bình luận và nhắn riêng từ bình luận có trong API (1 lần/bình luận, bình luận <7 ngày) → P2.
- Không có trường SĐT riêng: chỉ gender, birthday, notes → bot ghi SĐT vào ghi chú.
- Webhook: Pancake → trang → Cài đặt → Công cụ → Webhook (theo dự án mã nguồn mở), mỗi trang tốn 1 lượt kết nối, không có chữ ký.
- Không có cờ 24 giờ, không công bố giới hạn gọi API. TikTok: Pancake là đối tác TikTok Business Messaging, API chưa kiểm. Threads: chưa thấy tài liệu.
- Tài khoản Pancake đang nối với Claude thấy 3 trang (MagentX.ai FB, MagentX IG, Zalo cá nhân Ngọc Vũ), có quyền ghi.

## Cần thử trên tài khoản thật (đầu giai đoạn 5)
- Bật webhook, đo độ trễ; webhook có báo tin nhân viên gửi không (nếu không: vòng quét phải phát hiện để bot không trả lời trùng nhân viên)
- Ảnh QR qua link SePay hiển thị trên Messenger và Instagram
- Phân biệt tin bot gửi và tin nhân viên gửi (kể cả khi webhook về trước khi bot kịp lưu mã tin)
- Câu trả lời tự động của quảng cáo hiện trong dữ liệu Pancake thế nào, có phân biệt được với tin nhân viên không
- Giới hạn gọi API khi dồn dập; lỗi khi gửi ngoài khung 24 giờ
- Tải trước ảnh/video lên Pancake qua API công khai, gửi bằng mã; video hiển thị trong chat
- ngrok trên MacBook nhận webhook ổn định qua đêm
- Tắt mạng/tắt bot giả lập rồi bật lại: bot nhặt đủ tin sót, không gửi trùng
- Sao lưu 2 giờ và khôi phục thử thành công
- (Trước khi chuyển lên máy chủ) kết nối Supabase qua session pooler, pg-boss chạy được

## Dữ liệu cá nhân
SĐT không gửi cho AI, không ghi log, không gửi lên Telegram; nhật ký tin lưu 90 ngày. Giai đoạn Mac: database nằm tại Việt Nam; nội dung chat (đã che SĐT) vẫn qua Claude, Pancake. Luật BVDLCN 2025 hiệu lực 1/1/2026; doanh nghiệp nhỏ/khởi nghiệp được chọn chưa làm hồ sơ đánh giá tác động trong 5 năm. Trước khi bật khách thật: hỏi luật sư một lần về dữ liệu ra nước ngoài (Claude, Pancake; sau này Supabase Singapore) và thời hạn lưu; cần trang chính sách quyền riêng tư.

## Bảo vệ tài khoản và khóa bí mật
1. Khóa bí mật: chỉ trong biến môi trường (Railway) hoặc .env trên Mac (nằm trong .gitignore); GitHub chỉ có .env.example; kho private, Secret scanning + Push protection; bản thử/bản thật khóa khác nhau; lộ khóa → đổi ngay; README ghi cách đổi. Mật khẩu database và mật khẩu mã hóa bản sao lưu cất trong trình quản lý mật khẩu.
2. Tài khoản quản trị: 2FA cho Railway, Supabase (khi tạo), GitHub, Google, Claude Console, Pancake, Telegram ngay khi tạo; chỉ người dùng + tối đa 1 người tin cậy; sale chỉ dùng Pancake (+ nhóm Telegram); trình quản lý mật khẩu; nhân sự nghỉ → gỡ quyền, đổi khóa.
3. Quyền tối thiểu: Google service account chỉ đọc Sheet kho kiến thức (ghi Sheet đơn hàng khi bật) và chỉ ghi thư mục sao lưu trên Drive; database chỉ nhận kết nối trong máy, tài khoản bot riêng; giới hạn chi tiêu Claude Console; token Pancake theo trang; Telegram chỉ nhận lệnh/nút từ danh sách được phép.
4. Dữ liệu khách: không log SĐT, SĐT cột riêng, tự xóa nhật ký theo hạn; FileVault; sao lưu mã hóa 2 giờ; thử khôi phục trước khi có khách thật và 2 tuần/lần.
Phân bổ: 2FA khi tạo tài khoản · quyền bảng/thời hạn lưu GĐ3 · .gitignore/.env.example/private GĐ5 · kiểm tra đầu vào, không log SĐT, xác thực webhook GĐ6 · rà soát + 20 câu lừa bot GĐ7 · sao lưu/khôi phục, biến môi trường, giới hạn chi tiêu GĐ8–9.

## Nơi làm các giai đoạn tiếp theo
GĐ3–4: tiếp tục trong Project "Agent Chatbot", mỗi giai đoạn một chat mới. Từ GĐ5: Claude Code trên kho GitHub; chép PRD, kiến trúc, database vào docs/ và quy trình 10 giai đoạn vào CLAUDE.md. Không tạo Project mới.

## Bước tiếp theo
GĐ4 (chat mới): thiết kế giao diện và trải nghiệm — mẫu tin Telegram + nút bấm (nhóm sale và quản trị), bản Google Sheet mẫu 12 tab có dropdown, phía Pancake/khách hàng (bộ tag, mẫu ghi chú, tin gửi STK + QR, danh sách câu mẫu bắt buộc), lệnh tắt khẩn cấp, trạng thái lỗi/trống. Người dùng chuẩn bị song song: fanpage thử nghiệm, Claude API, GitHub, nhóm Telegram cho sale, ngrok, Google Drive cho sao lưu (bật 2FA khi tạo). Chưa cần tài khoản Supabase.
