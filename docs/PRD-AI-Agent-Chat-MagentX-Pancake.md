# PRD – AI Agent Chat tư vấn & chốt đơn MagentX trên Pancake

Ngày chốt: 19/11/2026 · Trạng thái giai đoạn 1 (Phân tích yêu cầu): ĐÃ HOÀN THÀNH
Bản sống (có thể đã được sửa sau): https://claude.ai/artifact/Rvrvb2r8H1txLZZ7BhinJK

## 1. Tổng quan

MagentX cần một AI Agent trực inbox 24/7 trên Fanpage MagentX.ai và Instagram MagentX (quản lý qua Pancake), tự tư vấn khóa học, lấy số điện thoại, gửi thông tin chuyển khoản và chuyển cho nhân viên khi cần.

**Vấn đề hiện tại:** khách nhắn từ quảng cáo vào nhiều giờ khác nhau, nhân viên trả lời chậm hoặc ngoài giờ không ai trực, khách nguội và mất đơn. Câu hỏi lặp lại nhiều (học phí, học gì, học online hay offline, có hỗ trợ không).

**Mục tiêu đo được:**

| Chỉ số | Cách tính | Mục tiêu MVP |
| --- | --- | --- |
| Thời gian phản hồi tin đầu tiên | Từ lúc khách gửi đến lúc bot trả lời | dưới 5 giây |
| Tỷ lệ hội thoại bot tự xử lý | Hội thoại không bị gắn tag Cần người / tổng hội thoại | từ 70% (dài hạn 90%) |
| Tỷ lệ khách để lại SĐT | Hội thoại có SĐT / tổng khách mới | tăng so với hiện tại (cần số liệu gốc) |
| Tỷ lệ chốt của bot | Đơn đã xác nhận CK mà nhân viên không phải tư vấn (tag Bot chốt) / tổng khách mới | đo trong 4 tuần đầu để đặt mốc |
| Tỷ lệ chốt tổng (bot + nhân viên) | Tất cả đơn đã xác nhận CK (tag Đã mua) / tổng khách mới | cao hơn trước khi có bot (cần số liệu gốc) |
| Câu trả lời sai về giá, ưu đãi, nội dung khóa | Đếm trên bộ kiểm thử | 0 |

"Tổng khách mới" không tính khách gắn tag Khách rác. Bạn nên lấy số liệu chốt đơn 1–2 tháng gần nhất làm mốc so sánh.

**Phạm vi MVP:**

- Kênh: Facebook MagentX.ai, Instagram MagentX. Thiết kế sẵn để thêm fanpage hoặc kênh khác (TikTok, Threads...) mà không viết lại (xem mục 5, Thiết kế mở rộng nhiều trang, nhiều kênh).
- Không làm ở MVP: Zalo cá nhân Ngọc Vũ (rủi ro bị khóa tài khoản), tự động xác nhận tiền về, chăm sóc sau mua (gửi link nhóm, nhắc học, bán thêm), trả lời bình luận.
- Khóa học bot tư vấn: Khóa Edit video, Khóa Làm video AI. Khóa Xây kênh TikTok/YouTube chưa ra mắt nên không có trong MVP; khi ra mắt chỉ cần thêm file dữ liệu, không sửa code.

## 2. Người dùng và hành trình khách hàng

Hệ thống có 3 nhóm người dùng: khách nhắn tin, nhân viên sale trên Pancake, và quản trị (bạn) cập nhật kiến thức cho bot.

| Người dùng | Cần gì từ hệ thống |
| --- | --- |
| Khách tiềm năng (từ quảng cáo, bài đăng) | Được trả lời ngay, đúng giá, biết khóa nào hợp với mình, biết cách thanh toán |
| Nhân viên sale | Nhận lại đúng khách cần người, thấy được bot đã nói gì, xác nhận chuyển khoản |
| Quản trị | Sửa giá, ưu đãi, FAQ mà không cần biết code; bật/tắt bot |

**Hành trình chuẩn của khách:**

1. Khách nhắn tin (thường từ quảng cáo Meta). Bot chào trong 5 giây và hỏi khách quan tâm khóa nào.
2. Bot hỏi 2–3 câu ngắn để hiểu nhu cầu: mục tiêu (làm nghề, làm kênh, bán hàng), đã biết dựng video/AI chưa.
3. Bot giới thiệu khóa phù hợp, trả lời câu hỏi, gửi ảnh/video demo nếu có.
4. Bot xin SĐT và tên, gắn tag mức độ quan tâm lên hội thoại.
5. Khách đồng ý mua: bot gửi số tài khoản + mã QR kèm nội dung chuyển khoản riêng cho khách đó, dặn gửi ảnh bill.
6. Khách gửi bill: bot cảm ơn, gắn tag "Chờ xác nhận CK" và chuyển cho nhân viên kiểm tra tài khoản.
7. Nhân viên xác nhận tiền về, gửi thông tin vào học (làm tay ở MVP).

## 3. Tính năng MVP

MVP gồm 6 tính năng bắt buộc (P1); P2 làm sau khi bot chạy ổn 2–4 tuần; F11–F12 là mục tiêu bản final nhưng kiến trúc phải chừa sẵn chỗ từ đầu.

| # | Tính năng | Bot làm gì | Ưu tiên |
| --- | --- | --- | --- |
| F1 | Tự trả lời | Nhận tin mới từ FB/IG qua Pancake, trả lời dưới 5 giây, giọng thân thiện xưng "mình – bạn" hoặc "em – anh/chị" | P1 |
| F2 | Tư vấn khóa học và FAQ | Trả lời CHỈ dựa trên kho kiến thức MagentX (giá, nội dung, lịch, hình thức học, hỗ trợ, hoàn phí). Không tự bịa giá hay ưu đãi | P1 |
| F3 | Gợi ý khóa phù hợp | Hỏi 2–3 câu nhu cầu rồi đề xuất 1 khóa hoặc combo, nêu lý do | P1 |
| F4 | Xin SĐT + gắn tag | Xin tên, SĐT đúng lúc (sau khi khách đã quan tâm), kiểm tra SĐT hợp lệ, lưu vào thông tin khách trên Pancake, gắn tag | P1 |
| F5 | Chốt đơn bằng chuyển khoản | Gửi STK + QR + nội dung CK có mã đơn; nhận bill → tag "Chờ xác nhận CK" + báo nhân viên | P1 |
| F6 | Chuyển nhân viên | Khi gặp tình huống ở mục 4: báo khách chờ, gắn tag "Cần người", dừng trả lời trong hội thoại đó | P1 |
| F7 | Ghi chú tóm tắt | Ghi note ngắn lên hồ sơ khách: quan tâm khóa gì, đang vướng gì | P2 |
| F8 | Nhắc khách đã hỏi mà chưa mua | Gửi 1 tin nhắc trong khung 24 giờ theo quy định của Meta | P2 |
| F9 | Báo cáo | Số hội thoại, SĐT, đơn chờ CK, lần chuyển người, tỷ lệ chốt của bot và tổng, chi phí AI theo ngày; xem được cả báo cáo tổng và chi tiết từng trang | P2 |
| F10 | Tự xác nhận tiền về (SePay/Casso), chăm sóc sau mua | Giai đoạn sau | P3 |
| F11 | Khai thác thông tin và nỗi đau | Hỏi khéo để hiểu hoàn cảnh, mục tiêu, vấn đề khách đang gặp (thiếu kỹ năng, video ít view, không có thu nhập từ video...) rồi nối với khóa phù hợp; ghi lại vào hồ sơ khách | Bản final |
| F12 | Xử lý từ chối và thuyết phục | Nhận ra lý do từ chối (đắt, chưa có thời gian, sợ không theo kịp, để suy nghĩ thêm) và đáp lại theo bộ kịch bản MagentX duyệt; không hứa ngoài chính sách | Bản final |

Chừa chỗ cho F11–F12 từ đầu: kịch bản tư vấn, bộ câu hỏi khai thác và bộ câu xử lý từ chối nằm trong file dữ liệu riêng, nên nâng cấp chủ yếu là thêm dữ liệu và kiểm thử, không làm lại hệ thống. Hồ sơ khách có sẵn các trường: mục tiêu, nỗi đau, lý do từ chối.

**Bộ tag đề xuất trên Pancake:** Bot đang xử lý · Quan tâm Edit · Quan tâm Video AI · Đã có SĐT · Khách nóng · Chờ xác nhận CK · Cần người · Đã mua · Bot chốt (đơn bot tự chốt, để tính tỷ lệ chốt của bot) · Khách rác (spam, quấy rối, cố lừa bot, hỏi ngoài chủ đề nhiều lần; bot ngừng trả lời và không tốn tiền AI).

## 4. Quy tắc hội thoại và chuyển nhân viên

Bot được phép tư vấn và chốt đơn, nhưng phải chuyển người ngay khi không chắc hoặc chạm vào tiền, khiếu nại.

**Bot phải luôn:**

- Trả lời ngắn (tối đa 3–4 câu mỗi tin), mỗi tin kết thúc bằng 1 câu hỏi hoặc 1 bước tiếp theo.
- Chỉ nói giá, ưu đãi, hạn ưu đãi có trong kho kiến thức. Không có thì nói sẽ nhờ tư vấn viên báo lại.
- Không hứa điều ngoài chính sách (cam kết thu nhập, giảm giá thêm, tặng khóa).
- Không tự xác nhận "đã nhận tiền".

**Khi nào chuyển nhân viên:**

| Tình huống | Bot nói với khách | Tag |
| --- | --- | --- |
| Khách yêu cầu gặp người thật / gọi điện | Báo đã chuyển, tư vấn viên sẽ nhắn lại | Cần người |
| Câu hỏi không có trong kho kiến thức | Thừa nhận cần kiểm tra, hẹn trả lời | Cần người |
| Khách gửi bill chuyển khoản | Cảm ơn, báo đang kiểm tra | Chờ xác nhận CK |
| Xin giảm giá, trả góp, xuất hóa đơn, mua cho doanh nghiệp | Báo chuyển tư vấn viên phụ trách | Cần người |
| Khách bực bội, khiếu nại, đòi hoàn tiền | Xin lỗi, chuyển ngay | Cần người |
| Học viên cũ hỏi về bài học, tài khoản học | Chuyển bộ phận hỗ trợ | Cần người |
| Bot đã trả lời 3 lần mà khách vẫn chưa hiểu | Chuyển người | Cần người |

Sau khi chuyển, bot im lặng trong hội thoại đó cho đến khi nhân viên gỡ tag "Cần người". Bot cũng tự dừng khi thấy nhân viên đã nhắn tay vào hội thoại, để tránh hai bên cùng trả lời. Ngoài giờ làm việc, bot nói rõ thời điểm nhân viên sẽ phản hồi.

## 5. Kiến trúc đề xuất và dữ liệu cần chuẩn bị

**Đã chốt: phương án B** — bot riêng nối API Pancake, để toàn quyền kiểm soát cách trả lời và quy tắc chuyển nhân viên. Bảng dưới giữ lại để lưu lý do lựa chọn.

Sơ đồ luồng (5 thành phần): Khách hàng (Facebook MagentX.ai, Instagram MagentX) ⇄ Pancake Inbox (gom tin nhắn, tag, hồ sơ khách) ⇄ AI Agent (tư vấn, xin SĐT, gửi thông tin CK, gắn tag). AI Agent tra cứu Kho kiến thức (giá, ưu đãi, FAQ, STK – bạn tự sửa, không cần code). Pancake chuyển hội thoại có tag Cần người cho Nhân viên sale (nhận khách, xác nhận chuyển khoản).

Dù chọn phương án nào, Pancake vẫn là nơi nhân viên làm việc; chỉ khối "AI Agent" là thay đổi.

| | A. Botcake AI (của Pancake) | B. Bot riêng nối API Pancake |
| --- | --- | --- |
| Cách làm | Bật AI Agent, nạp tài liệu kiến thức, dựng kịch bản kéo thả | Máy chủ nhỏ nhận tin mới → gọi mô hình AI (Claude hoặc GPT) → trả lời và gắn tag qua API Pancake |
| Cần biết code | Không | Có (Claude viết, bạn chỉ cấu hình) |
| Kiểm soát cách trả lời, chuyển người | Theo giới hạn của công cụ | Toàn quyền |
| Chi phí | Gói Botcake (cần xem báo giá) | Tiền máy chủ + tiền gọi AI theo số tin (cần ước tính theo lượng tin thực tế) |
| Thời gian lên chạy thử | Khoảng vài ngày | Khoảng 2–3 tuần |

Pancake có API công khai để đọc hội thoại và tin nhắn (https://docs.pancake.vn/vi/developers/api-reference); việc nhận tin mới tức thì (webhook) cho phương án B cần xác minh thêm với Pancake. Botcake có AI Agent và nguồn kiến thức tài liệu (https://botcake.io/alternatives).

**Dữ liệu bạn cần chuẩn bị (gửi dạng file/thư mục khi bắt đầu code, chưa cần ngay):**

- [ ] Bảng khóa học: tên, giá gốc, giá ưu đãi và hạn, nội dung từng phần, thời lượng, học online/offline, quyền lợi, ai nên học
- [ ] 30–50 câu hỏi khách hay hỏi nhất kèm câu trả lời chuẩn (lấy từ inbox cũ)
- [ ] Chính sách: hoàn phí, bảo lưu, hỗ trợ sau khóa, combo
- [ ] Thông tin chuyển khoản: ngân hàng, STK, chủ tài khoản, cú pháp nội dung CK
- [ ] Giọng văn và cách xưng hô; 5–10 đoạn chat chốt đơn thành công làm mẫu
- [ ] Giờ làm việc của nhân viên và danh sách người nhận khách được chuyển

Kho kiến thức nên để ở một Google Sheet/Doc duy nhất để bạn tự sửa giá, ưu đãi mà không cần nhờ ai.

### Thiết kế tiết kiệm chi phí AI từ đầu

Với 200–500 hội thoại/ngày và ngân sách 3–7 triệu/tháng, mỗi tin nhắn phải đi qua "bộ lọc" trước khi tốn tiền AI:

1. **Không gọi AI** khi không cần: sticker, ảnh không phải bill, tin trống, khách có tag Khách rác hoặc Cần người, câu có đáp án cố định (chào hỏi, STK, giá niêm yết) → trả lời bằng mẫu có sẵn.
2. **Hai tầng mô hình AI:** mặc định dùng mô hình nhỏ, nhanh, rẻ (ví dụ Claude Haiku) cho đa số câu; chỉ chuyển lên mô hình mạnh hơn (ví dụ Claude Sonnet) khi cần tư vấn sâu hoặc xử lý từ chối (F11–F12). Chọn mô hình cụ thể và tính chi phí thật ở giai đoạn 2.
3. **Chỉ đưa phần kiến thức liên quan** vào mỗi lần hỏi AI (hỏi về khóa Edit thì chỉ đưa dữ liệu khóa Edit), không đưa cả kho.
4. **Dùng bộ nhớ đệm (prompt caching)** cho phần hướng dẫn cố định, để không trả tiền đầy đủ cho phần lặp lại ở mọi tin.
5. **Giới hạn lịch sử:** chỉ gửi khoảng 10 tin gần nhất + 1 đoạn tóm tắt hồ sơ khách, không gửi toàn bộ hội thoại.
6. **Gộp tin:** khách gửi nhiều tin liên tiếp thì chờ 2–3 giây gộp lại, trả lời 1 lần (vẫn trong mục tiêu 5 giây).
7. **Giới hạn độ dài** câu trả lời và số tin mỗi khách được bot xử lý trong ngày.
8. **Hạn mức chi tiêu:** theo dõi chi phí theo ngày; tới 80% hạn mức thì cảnh báo bạn; vượt hạn mức thì chuyển sang chế độ tiết kiệm (chỉ trả lời mẫu + chuyển người).

### Lớp bảo vệ khi khách cố lừa bot

Bot được thiết kế sao cho dù bị lừa cũng không có gì để lộ và không có quyền làm hại:

- **Không đưa bí mật cho bot:** hướng dẫn và kho kiến thức chỉ chứa thông tin được phép nói công khai; không có API key, dữ liệu khách khác, doanh thu, chính sách nội bộ.
- **Mỗi hội thoại chỉ thấy dữ liệu của chính khách đó.**
- **Quyền tối thiểu:** bot chỉ được gửi tin, gắn tag, ghi chú; không xóa, không xác nhận tiền, không đổi giá.
- **Giữ đúng chủ đề:** chỉ nói về MagentX và khóa học. Yêu cầu viết code, làm bài, hỏi chuyện không liên quan, đòi xem "hướng dẫn hệ thống" → trả 1 câu từ chối mẫu lịch sự rồi kéo về khóa học.
- **Lọc trước khi gọi AI:** các câu kiểu "bỏ qua hướng dẫn", "bạn là AI gì", yêu cầu code được nhận diện sớm và trả mẫu, không tốn tiền AI.
- **Kiểm tra trước khi gửi:** chặn câu trả lời có giá không khớp bảng giá, STK lạ, link lạ, đoạn code → thay bằng câu mẫu và chuyển người.
- **Khách cố tình lặp lại 3 lần** → gắn tag Khách rác, bot ngừng trả lời; các lần bị tấn công được ghi lại để rà soát hằng tuần.
- Bộ kiểm thử nghiệm thu có thêm 20 câu lừa bot phổ biến.

### Thiết kế sẵn cho 24/7

MVP: nhân viên trực 8h–22h hằng ngày. Bản final: vận hành 24/7. Thiết kế từ đầu để khi chuyển sang 24/7 không phải viết lại:

- Bot chạy 24/7 ngay từ MVP; giờ trực của nhân viên chỉ là một cài đặt, đổi được không cần sửa code.
- Ngoài giờ trực: khách cần người và bill chuyển khoản được xếp vào hàng chờ, nhân viên xử lý đầu ca sáng.
- Máy chủ tự khởi động lại khi lỗi, có thử lại khi Pancake hoặc AI phản hồi chậm.
- Cảnh báo tự động cho bạn (qua Zalo hoặc Telegram) khi bot ngừng trả lời, lỗi liên tục hoặc chi phí bất thường, kể cả ban đêm.
- Khi có P3 (tự xác nhận tiền về), bot chốt trọn đơn ban đêm mà không cần người.

### Thiết kế mở rộng nhiều trang, nhiều kênh

Thêm một fanpage hoặc kênh mới là việc cài đặt, không phải làm lại hệ thống:

- **Pancake là cổng duy nhất.** Bot chỉ nói chuyện với Pancake, không nối thẳng với Facebook hay TikTok. Kênh nào Pancake hỗ trợ nhắn tin thì bot dùng được.
- **Mỗi trang là một dòng cài đặt:** bật/tắt bot, khóa học được tư vấn, cách xưng hô, giờ trực, nhân viên nhận khách. Thêm fanpage mới là thêm một dòng, không cần sửa code.
- **Quy tắc riêng từng nền tảng được tách ra.** Ví dụ Meta chỉ cho nhắn khách trong 24 giờ từ tin cuối của khách; TikTok có giới hạn riêng. Thêm kênh chỉ cần thêm phần quy tắc cho kênh đó.
- **Báo cáo và chi phí có hai cấp:** báo cáo tổng toàn hệ thống và báo cáo chi tiết từng trang (hội thoại, SĐT, tỷ lệ chốt của bot và tổng, chi phí AI), để biết kênh nào chốt tốt, kênh nào tốn tiền AI.

Cần xác minh ở giai đoạn 2: Pancake có cho trả lời tin nhắn TikTok và Threads qua API không. Trả lời bình luận là tính năng riêng, chưa có trong MVP.

## 6. Nghiệm thu, rủi ro và lộ trình

Bot chỉ được bật cho toàn bộ khách sau khi qua đủ tiêu chí dưới đây trên bộ kiểm thử và 1 tuần chạy thử có người giám sát.

**Tiêu chí nghiệm thu:**

- [ ] Trả lời đúng 100% câu hỏi về giá, ưu đãi, STK trong bộ 50 câu kiểm thử
- [ ] Không bịa thông tin khi gặp câu hỏi ngoài kho kiến thức (chuyển người đúng 100% tình huống ở mục 4)
- [ ] Phản hồi dưới 5 giây với ít nhất 95% tin nhắn
- [ ] Gắn đúng tag và lưu đúng SĐT lên Pancake
- [ ] Dừng trả lời khi nhân viên đã vào hội thoại
- [ ] Bạn và 1 nhân viên sale đọc 30 hội thoại thật và đồng ý giọng văn ổn

**Rủi ro cần xử lý:**

| Rủi ro | Cách giảm |
| --- | --- |
| Tài khoản Pancake dùng để tích hợp chưa có quyền Admin Fanpage MagentX.ai (API báo thiếu quyền) | Bạn tự cấp quyền; phải xong trước tuần 2 (xem nhắc việc ở lộ trình) |
| Bot nói sai giá hoặc hứa bừa | Chỉ trả lời từ kho kiến thức; kiểm tra câu trả lời trước khi gửi; cập nhật kho mỗi lần đổi ưu đãi |
| Khách dùng mẹo để bot làm lộ thông tin, hỏi lung tung, bắt bot viết code | Lớp bảo vệ ở mục 5: bot không giữ bí mật, quyền tối thiểu, lọc trước và kiểm tra sau, lặp lại 3 lần thì gắn Khách rác và ngừng trả lời |
| Bot và nhân viên cùng trả lời một khách | Dừng bot khi có tag Cần người hoặc nhân viên đã nhắn |
| Meta giới hạn nhắn tin sau 24 giờ từ tin cuối của khách | Chỉ nhắc lại trong khung 24 giờ |
| Thu thập SĐT là dữ liệu cá nhân | Bổ sung chính sách quyền riêng tư, rà soát quy định bảo vệ dữ liệu cá nhân hiện hành tại Việt Nam; không ghi SĐT vào log |
| Chi phí AI tăng khi chạy quảng cáo lớn | Thiết kế tiết kiệm từ đầu ở mục 5: bộ lọc không gọi AI, hai tầng mô hình, chỉ đưa kiến thức liên quan, bộ nhớ đệm, hạn mức chi tiêu và chế độ tiết kiệm |
| Bot ngừng hoạt động ban đêm mà không ai biết | Tự khởi động lại + cảnh báo tự động (mục 5, Thiết kế sẵn cho 24/7) |

**Lộ trình:**

1. Tuần 1: bạn xác nhận PRD này và cấp quyền Admin Fanpage cho tài khoản tích hợp. Claude làm giai đoạn 2–3: kiến trúc, chọn công nghệ trong ngân sách, thiết kế database.
2. Tuần 2–3: dựng dự án và lập trình F1–F6; bạn gửi thư mục dữ liệu khóa học để nạp kho kiến thức.
3. Tuần 3: kiểm thử trên bộ 50 câu, kiểm tra bảo mật.
4. Tuần 4: chạy thử có giám sát trên Instagram trước (ít tin hơn), sau đó Facebook.
5. Sau 2–4 tuần ổn định: làm P2 (ghi chú, nhắc khách, báo cáo), rồi P3 (tự xác nhận tiền về, chăm sóc sau mua).

> **Nhắc việc (bạn tự xử lý):** cấp quyền Admin Fanpage MagentX.ai và Instagram MagentX cho tài khoản Pancake dùng để tích hợp, trước khi bắt đầu tuần 2. Thiếu quyền này thì bot không đọc và gửi tin được.

**Thông tin vận hành đã chốt:**

| Hạng mục | Giá trị | Ảnh hưởng tới thiết kế |
| --- | --- | --- |
| Hội thoại mới | 200–500/ngày khi chạy quảng cáo | Cần xử lý nhiều hội thoại cùng lúc, có hàng đợi và thử lại khi lỗi |
| Ngân sách | 3–7 triệu đồng/tháng (AI + máy chủ) | Thiết kế tiết kiệm chi phí từ đầu (mục 5); ước tính chi tiết ở giai đoạn 2 |
| Nhân viên sale | 2–3 người | Chia khách được chuyển cho nhau (xoay vòng) |
| Giờ trực | MVP: 8h–22h hằng ngày. Bản final: 24/7 | Giờ trực là một cài đặt; ngoài giờ thì xếp hàng chờ. Xem mục 5, Thiết kế sẵn cho 24/7 |

**Trạng thái giai đoạn 1 (Phân tích yêu cầu):** ĐÃ HOÀN THÀNH (người dùng xác nhận ngày 19/11/2026). Phạm vi MVP đã được duyệt; bước tiếp theo là giai đoạn 2 – thiết kế kiến trúc cho phương án B. Dữ liệu khóa học gửi khi bắt đầu code.
