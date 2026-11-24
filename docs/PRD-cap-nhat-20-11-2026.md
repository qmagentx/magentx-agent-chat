# PRD – Cập nhật 20/11/2026 (theo giai đoạn 2 – kiến trúc, giai đoạn 3 – database; bổ sung 21/11 theo giai đoạn 4 – giao diện)

Bổ sung cho `claude/PRD-AI-Agent-Chat-MagentX-Pancake.md` (bản chốt 19/11). Bản sống đã được sửa theo các điểm 1–10 (chưa có các điểm 11–29): https://claude.ai/artifact/Rvrvb2r8H1txLZZ7BhinJK
Chi tiết thiết kế: `claude/Kien-truc-giai-doan-2-AI-Agent-Chat-MagentX.md`, `claude/Database-va-Google-Sheet-giai-doan-3-AI-Agent-Chat-MagentX.md` và `claude/Thiet-ke-giao-dien-giai-doan-4-AI-Agent-Chat-MagentX.md`.

## Thay đổi theo giai đoạn 2 (kiến trúc)
1. **Mục tiêu dưới 5 giây** tính từ tin cuối cùng khách gửi trong lượt (bot chờ khách nói xong: 4 giây sau tin cuối, tối đa 12 giây). Áp dụng cho bảng mục tiêu và tiêu chí nghiệm thu "dưới 5 giây với ≥95% tin".
2. **Chuyển nhân viên im lặng:** bot không nhắn gì cho khách khi chuyển, kể cả ngoài giờ (bỏ "báo khách chờ" và "báo giờ phản hồi ngoài ca"). Ngoại lệ duy nhất: khách gửi bill → 1 câu xác nhận nghe như người ("Mình nhận được rồi, mình kiểm tra và báo bạn sớm nhé"). Rủi ro chấp nhận: khách nhắn đêm chờ đến 8h sáng.
3. **Danh tính bot:** giữ giọng tự nhiên; không tự giới thiệu là AI, nhưng không bao giờ khẳng định là người. Khách hỏi "bạn là người hay bot"/"bạn là AI gì" → chuyển nhân viên im lặng.
4. **Thêm tình huống chuyển người:** khách gửi link, video, tin nhắn thoại, hoặc ảnh thứ 4 trở đi trong hội thoại; khách dùng hết 30 lượt trả lời bằng AI trong ngày; câu trả lời AI không qua bước kiểm tra, hoặc AI lỗi/chậm. (Bot đọc tối đa 3 ảnh/hội thoại; ảnh bill sau khi gửi STK không tính.)
5. **Giới hạn mỗi khách:** 30 lượt trả lời bằng AI/khách/ngày (chỉ đếm lượt bot trả lời bằng AI).
6. **Xác nhận tiền về:** bot báo nhóm Telegram sale (không kèm SĐT); sale bấm "Tiền đã về" → bot gắn tag Đã mua (+ Bot chốt). Nơi ghi đơn học viên chưa chọn (công ty kiểm tra); MVP lưu phiếu đơn trong database + ghi chú Pancake.
7. **Thư viện ảnh/video:** feedback và showcase gửi ngay trong khung chat (không link). Dữ liệu cần chuẩn bị thêm: thư mục ảnh/video đặt tên `khoa_loai_chude_so` + 1 dòng mô tả mỗi file trong tab "Thư viện media" của Google Sheet (video ≤15 MB).
8. **Cảnh báo tỷ lệ chuyển người:** vượt 30% số hội thoại trong ngày → báo Telegram kèm số lần theo từng lý do.
9. **Lộ trình chạy thử:** toàn bộ trên fanpage thử nghiệm riêng (bot chạy trên MacBook, gửi thật, không dùng chế độ Nháp), sau đó bật dần trên Instagram rồi Facebook (thay cho "chạy thử có giám sát trên Instagram trước").
10. **P2 bổ sung:** trả lời bình luận + nhắn riêng từ bình luận; mô hình AI dự phòng (OpenAI/Gemini).

## Thay đổi theo giai đoạn 3 (database – người dùng xác nhận 20/11/2026)
11. **Giá luôn đúng:** AI không tự viết số tiền hay STK; AI chỉ viết chỗ trống (vd `{gia:edit}`), hệ thống điền giá từ Google Sheet. Câu AI tự viết con số tiền → chặn và chuyển nhân viên im lặng.
12. **Không tự hủy đơn:** gửi STK xong gắn tag **"Chờ chuyển khoản"** (thêm vào bộ tag); khách gửi bill → "Chờ xác nhận CK". Khách đổi khóa → đơn cũ hủy, đơn mới mã mới. Đơn giữ số tiền lúc gửi STK; sale đối chiếu nếu khách chuyển sau khi hết ưu đãi.
13. **Bảo vệ STK:** STK trong Sheet bị đổi → bot không gửi STK mới cho đến khi quản trị bấm xác nhận trên Telegram.
14. **Nơi chạy:** ứng dụng và database đều trên MacBook cả lúc thử lẫn thời gian đầu chạy khách thật (dự kiến 10–30 ngày); chuyển lên Railway + Supabase Pro (Singapore) khi đạt mốc chất lượng 14 ngày liên tiếp (0 lần sai giá/STK, chuyển người <30%, bot tự xử lý ≥70%, kiểm tra không qua <2%, ≥95% tin đúng mục tiêu thời gian, không ngừng >15 phút mà không ai biết, đọc 30 hội thoại thấy ổn), hoặc sớm hơn nếu Mac trục trặc/quá 60 ngày.
15. **Sao lưu:** mã hóa mỗi 2 giờ lên Google Drive; thử khôi phục trước khi có khách thật và 2 tuần/lần. Điều kiện trước khi có khách thật: FileVault, database chỉ mở trong máy.
16. **Bot ngừng rồi chạy lại:** nhặt lại tin sót; tin chờ <30 phút trả lời bình thường, 30 phút–23 giờ trả lời kèm câu xin lỗi muộn (câu mẫu người dùng soạn), >23 giờ chuyển sale. Bot ngừng trong giờ 8h–22h → báo nhóm sale và người được chọn (vd manager). Không dùng bộ lưu điện; Mac khởi động lại bất ngờ cần người gõ mật khẩu.
17. **Nhật ký tin nhắn** lưu 90 ngày (thay 180 ngày đề xuất trước).
18. **Google Sheet 12 tab:** Đọc trước · Khóa học · Ưu đãi · FAQ · Chính sách · Chuyển khoản · Câu mẫu · Thư viện media · Từ khóa · Cài đặt trang · Nhân viên · Cài đặt chung. Nhân viên và cài đặt (hạn mức, giới hạn, mốc trả lời muộn) sửa trên Sheet.
19. **Pháp lý:** trước khi bật khách thật, hỏi luật sư một lần về dữ liệu khách ra nước ngoài (Claude, Pancake; sau này Supabase) và thời hạn lưu SĐT/đơn.

## Thay đổi theo giai đoạn 4 (giao diện – người dùng xác nhận 21/11/2026)
20. **Cách tính chỉ số:** "Tỷ lệ hội thoại bot tự xử lý" và "tỷ lệ chuyển người" **không tính hội thoại chỉ chuyển sale vì khách gửi bill** (bán được hàng không làm xấu chỉ số). Áp dụng cho bảng mục tiêu, cảnh báo 30% và mốc chất lượng 14 ngày (điểm 14).
21. **Xác nhận tiền về chỉ qua nút Telegram:** chỉ người có quyền "Được bấm Tiền đã về" xác nhận được. Nhân viên gắn tag "Đã mua" trên Pancake chỉ tạo tin báo nhóm sale, không tự xác nhận (sửa điểm 6).
22. **Hủy đơn:** nhân viên gỡ tag "Chờ chuyển khoản" → hủy đơn; gắn lại trong 24 giờ → khôi phục (giữ mã, không gửi lại STK). Gỡ tag "Chờ xác nhận CK" → không hủy, chỉ báo nhóm sale.
23. **Tin gửi STK cho khách:** 2 tin liên tiếp (ảnh QR → tin chữ: ngân hàng, STK, chủ TK, số tiền, nội dung CK). Câu mở/kết do người dùng soạn trong câu mẫu `gui-stk`; khối thông tin chuyển khoản do code tạo.
24. **Ảnh sau khi gửi STK:** ảnh khách gửi trong 7 ngày sau khi nhận STK (kể cả đơn đã hủy) được coi là bill → câu xác nhận bill + chuyển sale.
25. **Nhắc sale:** trong giờ trực, khách đã chuyển sale mà quá 15 phút chưa có nhân viên trả lời → báo nhóm sale (mỗi khách 1 lần).
26. **Canh bot ngừng:** thay UptimeRobot bằng Google Apps Script (miễn phí): bot gửi nhịp tim mỗi phút; mất nhịp tim 2 lần kiểm tra liên tiếp → báo quản trị (24/7) và nhóm sale (8h–22h) qua bot Telegram riêng "MagentX Canh".
27. **Báo cáo:** báo cáo ngày lúc 8h00 mỗi sáng; bảng chất lượng tuần sáng thứ Hai 8h00.
28. **Bảo vệ quyền trong Sheet:** thêm Quản trị, cấp quyền "Tiền đã về", đổi Telegram ID quản trị hoặc mã nhóm sale → phải bấm xác nhận trên Telegram mới có hiệu lực (giống bảo vệ STK, điểm 13).
29. **Lệnh Telegram cho quản trị:** `/tatbot` (tắt khẩn cấp, có hiệu lực ngay), `/batbot` (bật lại, chỉ trả lời tin mới), `/trangthai`, `/baocao`, `/huongdan`.
