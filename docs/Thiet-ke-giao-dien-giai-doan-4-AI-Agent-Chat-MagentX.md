# Giai đoạn 4 – Thiết kế giao diện & trải nghiệm – AI Agent Chat MagentX

Ngày: 21/11/2026 · Trạng thái: **ĐÃ HOÀN THÀNH** (người dùng xác nhận 21/11/2026)
Đầu vào: `claude/Tom-tat-cho-giai-doan-4.md`. Chưa viết code, chưa tạo gì trên Telegram, Pancake, Google.

Hệ thống không có trang web riêng. "Giao diện" gồm 4 nơi: **tin bot gửi khách** (Messenger/Instagram), **tin và nút Telegram** (nhóm sale + quản trị), **tag và ghi chú trên Pancake**, **Google Sheet kho kiến thức**.

---

## 0. Quyết định của người dùng trong GĐ4 (21/11/2026)

| # | Vấn đề | Quyết định |
|---|---|---|
| Q1 | Ai báo "bot ngừng" khi MacBook tắt/mất mạng | **Google Apps Script** (miễn phí, chạy trên máy chủ Google, gửi tin tiếng Việt, đúng giờ trực). Thay UptimeRobot vì gói miễn phí của UptimeRobot hiện không còn gửi Telegram (Telegram chỉ có từ gói Solo trả phí). |
| Q2 | Nhân viên hủy đơn | **Gỡ tag trên Pancake** (chi tiết mục 7.3) |
| Q3 | Tin gửi STK cho khách | **2 tin liên tiếp**: ảnh QR → tin chữ đầy đủ |
| Q4 | Giờ báo cáo | **8h00 mỗi sáng**; bảng chất lượng tuần vào **sáng thứ Hai** |
| Q5 | Gỡ tag "Chờ xác nhận CK" | **Không hủy đơn**, chỉ báo nhóm sale (S10) |
| Q6 | Bot Telegram thứ hai "MagentX Canh" cho cảnh báo ngừng | **Có** |
| Q7 | Nhân viên gắn tag "Đã mua" trên Pancake (sau review) | **Chỉ báo nhóm sale**; đơn chỉ thành Đã thanh toán khi người có quyền bấm "Tiền đã về" |
| Q8 | Cách canh bot (sau review) | **Bot tự gửi nhịp tim** ra người canh mỗi phút (mục 6) |
| Q9 | Sau `/batbot` có gửi danh sách khách nhắn lúc tắt không | **Không** |
| Q10 | Tên khách trên Telegram | **Giữ đầy đủ** |

---

## 1. Nguyên tắc chung – đọc tốt trên điện thoại

1. **Dòng đầu nói hết ý chính**: biểu tượng mức độ + việc gì + cần làm gì. Nhìn thông báo trên màn hình khóa là hiểu.
2. **Biểu tượng mức độ** (dùng thống nhất):
   🔴 khẩn – cần làm ngay · 🟡 chú ý – xem trong ngày · 🟢 đã ổn / đã xử lý · 💰 tiền, đơn · 📊 báo cáo · ⛔ bot bị tắt · ⚪ đã hủy.
3. **Tối đa ~12 dòng** mỗi tin. Không dùng bảng (Telegram trên điện thoại hiển thị bảng rất xấu). Mỗi dòng dạng `Nhãn: giá trị`.
4. **Tiền** luôn dạng `1.990.000đ`. **Giờ** dạng `14:32 21/11` (giờ Việt Nam). Khoảng thời gian: `52 phút`, `3 giờ 10 phút`.
5. **Nút**: tối đa 2 nút/hàng, chữ trên nút ≤ 20 ký tự, có biểu tượng đầu nút. Link hội thoại Pancake luôn là **nút "💬 Mở hội thoại"**, không dán link dài.
6. **Không bao giờ có SĐT khách** trong Telegram. Tên khách được phép.
7. **Xử lý xong thì sửa chính tin cũ** (đổi dòng đầu sang 🟢/⚪, bỏ nút), không gửi tin mới, để nhóm không bị trôi tin. Cảnh báo tự hết (ví dụ Sheet hết lỗi) thì gửi 1 tin 🟢 ngắn **trả lời vào tin cảnh báo cũ**.
8. **Không lặp cảnh báo**: cùng một vấn đề chỉ báo lại khi nội dung thay đổi hoặc theo nhịp nhắc ghi rõ ở từng tin.
9. **Ban đêm (22h–8h)**: tin không khẩn gửi **im lặng** (không rung, không chuông); tin 🔴 vẫn có chuông với quản trị. Nhóm sale không nhận tin ngoài giờ trực, trừ đơn có bill (vẫn gửi nhưng im lặng).

---

## 2. Tin bot gửi khách (Messenger / Instagram)

### 2.1 Gửi thông tin chuyển khoản – 2 tin (Q3)

Khách nhận liên tiếp trong 1–2 giây:

**Tin 1 – Ảnh QR** (VietQR qua qr.sepay.vn): đã gắn sẵn ngân hàng, số TK, số tiền, nội dung CK → khách quét bằng app ngân hàng là xong, không phải gõ gì.

**Tin 2 – Chữ** (ví dụ xưng mình – bạn):
```
Mình gửi bạn thông tin chuyển khoản khóa Edit video cơ bản nhé:

Ngân hàng: Vietcombank
Số tài khoản: 1234567890
Chủ tài khoản: NGUYEN VAN A
Số tiền: 1.990.000đ
Nội dung CK: MGX7K2Q9P

Bạn chuyển xong chụp giúp mình ảnh bill gửi vào đây nhé.
```
Quy tắc:
- Câu mở và câu kết do người dùng soạn trong câu mẫu `gui-stk`. **5 dòng giữa (khối chuyển khoản) do code tạo, cố định**, người dùng và AI không sửa được. Câu mẫu `gui-stk` phải chứa đúng 1 lần biến mới `{thong_tin_ck}` → code thay bằng khối 5 dòng. Thiếu biến này → câu mẫu không hợp lệ → bot không gửi STK, chuyển người + cảnh báo Sheet lỗi.
- Khối chuyển khoản không dùng biểu tượng (nhìn giống người gõ hơn), mỗi thông tin một dòng, số TK và mã đơn viết liền không cách.
- Thứ tự: ảnh trước, chữ sau → tin cuối khách thấy là phần chữ có lời nhắc gửi bill.
- Nếu ảnh QR gửi lỗi: vẫn gửi tin chữ (tin chữ là phần bắt buộc). **"Đã gửi STK" tính khi tin chữ gửi thành công** → đơn không bao giờ bị gửi STK lần 2.
- Instagram giống hệt Messenger. Ảnh QR hiển thị trên cả hai nơi cần thử ở GĐ5 (đã có trong danh sách thử của GĐ2).

### 2.2 Bố cục 5 câu mẫu bắt buộc (người dùng tự soạn nội dung)

Dưới đây là **ví dụ để tham khảo** (đặt sẵn trong Sheet mẫu ở trạng thái Dùng = Không). Mỗi câu ≤ 3–4 câu, kết thúc bằng câu hỏi hoặc bước tiếp theo.

| Mã | Khi nào dùng | Ví dụ (mình – bạn) |
|---|---|---|
| `chao-hoi` | Khách nhắn lần đầu, chưa nói rõ cần gì | Chào {ten_khach} nha, MagentX đây. Bạn đang quan tâm khóa Edit video hay khóa Làm video AI để mình tư vấn kỹ hơn nè? |
| `tu-choi-lac-de` | Khách hỏi chuyện ngoài khóa học | Phần này mình chưa hỗ trợ được bạn ơi. Mình chuyên tư vấn các khóa Edit video và Làm video AI, bạn đang muốn học để làm gì để mình gợi ý khóa hợp nhé? |
| `xac-nhan-bill` | Khách gửi bill (câu duy nhất trước khi chuyển sale) | Mình nhận được bill rồi nha, bạn đợi mình kiểm tra chút xíu, xong mình nhắn bạn liền. |
| `gui-stk` | Gửi thông tin chuyển khoản | Mình gửi bạn thông tin chuyển khoản khóa {ten_khoa} nhé: {thong_tin_ck} Bạn chuyển xong chụp giúp mình ảnh bill gửi vào đây nhé. |
| `xin-loi-tra-loi-muon` | Câu mở đầu khi trả lời tin chờ 30 phút–23 giờ sau khi bot ngừng | Xin lỗi bạn, mình trả lời hơi muộn. (sau đó là câu trả lời bình thường, tổng vẫn ≤ 4 câu) |

Mỗi câu mẫu có 2 cột nội dung: (mình – bạn) và (em – anh/chị); bot chọn theo cột "Xưng hô" của trang.

---

## 3. Tin Telegram – NHÓM SALE

Ai trong nhóm cũng đọc được, nhưng chỉ người có quyền mới bấm được nút "Tiền đã về".

### S1. Khách gửi bill – chờ xác nhận tiền (gửi ngay, kể cả ngoài giờ, ngoài giờ thì gửi im lặng)
```
💰 KHÁCH ĐÃ GỬI BILL – kiểm tra tiền về
Khách: Nguyễn Thu Hà
Khóa: Edit video cơ bản
Số tiền: 1.990.000đ
Nội dung CK: MGX7K2Q9P
Trang: MagentX.ai (Facebook)
Gửi STK: 14:05 21/11 · Bill: 14:32 21/11
[✅ Tiền đã về]  [💬 Mở hội thoại]
```
- Không chuyển tiếp ảnh bill vào Telegram (bill có thể có tên, số TK của khách). Sale xem bill trong Pancake.
- Nếu ưu đãi đã hết hạn sau lúc gửi STK, thêm dòng: `⚠️ Ưu đãi đã hết sau khi gửi STK – đối chiếu đúng 1.990.000đ`.
- Combo: dòng Khóa ghi tên combo.

### S2. Sau khi bấm "Tiền đã về" (bot sửa chính tin S1)
```
🟢 ĐÃ XÁC NHẬN TIỀN VỀ
Khách: Nguyễn Thu Hà
Khóa: Edit video cơ bản · 1.990.000đ
Nội dung CK: MGX7K2Q9P
Xác nhận: Linh lúc 14:40 21/11
[💬 Mở hội thoại]
```
Người bấm thấy thông báo nhỏ hiện giữa màn hình: "Đã ghi nhận – đơn chuyển sang Đã mua". Bot gắn tag Đã mua (+ Bot chốt nếu đủ điều kiện) trên Pancake. Bot **không** nhắn gì cho khách; sale tự nhắn chào mừng/mời vào nhóm học viên.

### S3. Bấm trùng (hai người bấm gần như cùng lúc)
Chỉ người bấm sau thấy thông báo nhỏ: `Đã được Linh xác nhận lúc 14:40`. Không gửi gì vào nhóm.

### S4. Không có quyền
Chỉ người bấm thấy thông báo nhỏ: `Bạn chưa có quyền bấm "Tiền đã về". Nhờ quản trị bật quyền trong Sheet, tab Nhân viên.` Không gửi gì vào nhóm.

### S5. Có người gắn tag "Đã mua" trên Pancake (Q7 – KHÔNG tự xác nhận)
Gắn tag không làm đơn thành Đã thanh toán. Bot trả lời vào tin S1 của đơn:
```
🟡 VỪA CÓ NGƯỜI GẮN TAG "ĐÃ MUA" – chưa xác nhận tiền
Khách: Nguyễn Thu Hà · MGX7K2Q9P · 1.990.000đ
Người có quyền kiểm tra tiền rồi bấm "Tiền đã về" ở tin trên.
```
- Đơn chưa gửi bill (chưa có S1): bot gửi tin trên kèm nút `[✅ Tiền đã về] [💬 Mở hội thoại]`.
- Người có quyền bấm xong → đơn Đã thanh toán, tin S1 sửa như S2.
- Tag "Đã mua" vẫn để nguyên trên Pancake (bot không gỡ tag của nhân viên); báo cáo chỉ tính đơn đã bấm xác nhận.

### S6. Đơn bị hủy do gỡ tag (mục 7.3)
```
⚪ ĐÃ HỦY ĐƠN MGX7K2Q9P
Khách: Nguyễn Thu Hà · Edit video cơ bản
Lý do: gỡ tag "Chờ chuyển khoản" trên Pancake lúc 16:10
Gỡ nhầm? Gắn lại tag trong 24 giờ để khôi phục đơn.
[💬 Mở hội thoại]
```

### S10. Tag "Chờ xác nhận CK" bị gỡ (đơn KHÔNG bị hủy)
Gửi trả lời vào tin S1 của đơn đó:
```
🟡 TAG "CHỜ XÁC NHẬN CK" VỪA BỊ GỠ – đơn vẫn chờ xác nhận
Khách: Nguyễn Thu Hà · MGX7K2Q9P · 1.990.000đ
Tiền đã về → người có quyền bấm "Tiền đã về" ở tin trên.
Bill có vấn đề → sale xử lý tay với khách trên Pancake.
[💬 Mở hội thoại]
```
Bot không tự gắn lại tag (tránh giành với nhân viên). Đơn vẫn nằm trong mục "bill chưa ai bấm" của báo cáo sáng cho đến khi được xác nhận.

### S11. Khách đã chuyển sale nhưng chưa ai trả lời (thêm sau review)
Trong giờ trực, 5 phút kiểm tra 1 lần; khách có tag Cần người mà **quá 15 phút** chưa có tin nhân viên:
```
🔴 4 KHÁCH CHỜ SALE QUÁ 15 PHÚT
1. Nguyễn Thu Hà · MagentX.ai · chờ 42 phút · Xin giảm giá/trả góp
2. Trần Minh · MagentX IG · chờ 18 phút · Khách đòi gặp người
...
[💬 Hà] [💬 Minh]
```
- Mỗi khách chỉ được nhắc 1 lần; tin mới chỉ chứa khách mới quá hạn. Có nhân viên trả lời → khách ra khỏi danh sách.
- Không tính lý do "Khách gửi bill" (đã có S1). Số phút chờ lấy từ tab Cài đặt chung.

### S7. Bot đang ngừng (do "người canh" Apps Script gửi, chỉ trong 8h–22h)
```
🔴 BOT ĐANG NGỪNG – sale trực inbox giúp
Ngừng từ: khoảng 14:10 21/11
Khách vẫn nhắn được bình thường. Sale trả lời tay trên Pancake.
Bot chạy lại sẽ báo trong nhóm này.
```
Cũng gửi riêng cho từng người có "Nhận cảnh báo bot ngừng = Có". Nếu bot ngừng từ ban đêm và đến 8h00 vẫn chưa chạy lại → gửi S7 lúc 8h00. Mỗi lần ngừng chỉ gửi nhóm sale 1 lần.

### S8. Bot đã chạy lại (do **người canh** gửi, chỉ khi chính người canh đã gửi S7)
```
🟢 BOT ĐÃ CHẠY LẠI lúc 15:02 – bot tiếp quản inbox
Hội thoại sale đã trả lời tay: bot không chen vào (dừng 24 giờ).
Muốn trả khách cho bot: gắn tag "Trả cho bot".
```

### S9. Khách chờ quá 23 giờ – sale tự liên hệ
```
🟡 3 KHÁCH CHỜ QUÁ 23 GIỜ – sale liên hệ giúp
Meta chỉ cho nhắn trong 24 giờ kể từ tin cuối của khách.
1. Nguyễn Thu Hà · MagentX.ai · còn ~35 phút để nhắn
2. Trần Minh · MagentX IG · còn ~10 phút để nhắn
3. Lê Văn B · MagentX.ai · đã quá 24 giờ – xem SĐT trong ghi chú Pancake
[💬 Hà] [💬 Minh]
[💬 B]
```
Người còn ít thời gian nhất đứng đầu. Tối đa 10 khách/tin; nhiều hơn thì tách tin.

---

## 4. Tin Telegram – QUẢN TRỊ (chat riêng với bot)

| Mã | Khi nào | Mức |
|---|---|---|
| A1 | Chi phí AI đạt 80% hạn mức ngày hoặc tháng | 🟡 |
| A2 | Vượt hạn mức | 🔴 |
| A3 | Tỷ lệ chuyển người > 30% trong ngày | 🟡 |
| A4 | Bot ngừng > 5 phút (Apps Script gửi) | 🔴 |
| A5 | Báo cáo khôi phục | 🟢 |
| A6 | Sheet lỗi / hết lỗi | 🔴 tab quan trọng · 🟡 tab phụ |
| A7 | Đồng bộ Sheet quá lâu không thành công | 🟡 |
| A8 | STK trong Sheet bị đổi | 🔴 có nút |
| A9 | Thư viện media có vấn đề / đã chuẩn bị xong | 🟡 / 🟢 |
| A10 | Sao lưu lỗi / quá 4 giờ chưa có bản / Drive gần đầy | 🔴 / 🟡 / 🟡 |
| A11 | Lỗi dồn dập (AI hoặc Pancake lỗi liên tục) | 🔴 |
| A12 | Báo cáo sáng 8h00 | 📊 |
| A13 | Bảng chất lượng tuần, sáng thứ Hai 8h00 | 📊 có nút |
| A14 | Trả lời lệnh (mục 5) | — |

### A1. Chi phí 80%
```
🟡 CHI PHÍ AI ĐẠT 80% HẠN MỨC NGÀY
Hôm nay: 80.400đ / 100.000đ
Tháng này: 1.240.000đ / 3.000.000đ
Nếu vượt: bot ngừng dùng Sonnet, rồi chuyển chế độ tiết kiệm.
Muốn nâng hạn mức: sửa tab Cài đặt chung.
```
Hạn mức ngày và tháng báo riêng, mỗi loại tối đa 1 lần/ngày (tháng: 1 lần/tháng).

### A2. Vượt hạn mức
```
🔴 VƯỢT HẠN MỨC AI NGÀY – 100.200đ / 100.000đ
Bot đã: ngừng dùng Sonnet từ 21:05.
Tiếp tục vượt → chế độ tiết kiệm (câu khó chuyển sale).
Tự trở lại bình thường: sang ngày mới, hoặc khi anh nâng hạn mức trong Sheet.
```

### A3. Chuyển người > 30%
```
🟡 CHUYỂN SALE 34% HÔM NAY (ngưỡng 30%)
86 / 253 hội thoại phải chuyển sale. Nhiều nhất:
• Không có trong kho kiến thức: 31
• Xin giảm giá/trả góp/hóa đơn: 22
• Khách đòi gặp người: 12
• 3 lần chưa hiểu: 9
• Khác: 12
(Không tính 22 khách gửi bill – đó là bán được hàng.)
Xem đủ lý do trong báo cáo sáng mai.
```
**Cách tính (sửa sau review):** khách gửi bill **không tính** là chuyển người, ở cả A3, A12, A13 và chỉ số "bot tự xử lý ≥70%" của PRD. Nếu tính, bán càng nhiều thì chỉ số càng xấu.
- Chỉ hiện tối đa 4 lý do nhiều nhất + "Khác"; tên lý do bằng tiếng Việt (bảng đối chiếu mã lý do ở mục 4.1).
- Chỉ báo khi trong ngày đã có **ít nhất 20 hội thoại** (tránh báo lúc sáng sớm khi 1/2 = 50%). Mỗi ngày tối đa 1 lần.

### 4.1 Tên tiếng Việt của mã lý do (dùng ở A3, A12, ghi chú Pancake)
customer_request: Khách đòi gặp người · kb_missing: Không có trong kho kiến thức · bill_received: Khách gửi bill · discount_installment_invoice: Xin giảm giá/trả góp/hóa đơn · complaint_refund: Khiếu nại/hoàn tiền · old_student: Học viên cũ · misunderstood_3x: 3 lần chưa hiểu · asked_if_bot: Hỏi người hay bot · link_video_voice: Gửi link/video/thoại · image_limit: Quá 3 ảnh · ai_quota: Hết 30 lượt AI · validation_failed: Không qua kiểm tra · ai_error: AI lỗi/chậm · savings_mode: Chế độ tiết kiệm · bank_unapproved: STK chưa duyệt · late_over_23h: Chờ quá 23 giờ.

### A4. Bot ngừng (Apps Script gửi, 24/7; ban đêm vẫn có chuông)
```
🔴 BOT NGỪNG TRẢ LỜI từ khoảng 14:10 21/11
Không nhận được nhịp tim của bot đã 5 phút.
Kiểm tra: MacBook còn bật? Còn mạng? Ứng dụng bot còn chạy?
Đã báo nhóm sale (trong giờ trực).
```
Nhắc lại sau 30 phút, sau đó mỗi 2 giờ, đến khi bot chạy lại. Dòng cuối đổi thành "Chưa báo nhóm sale (ngoài giờ trực)" khi ngoài 8h–22h.

### A5. Báo cáo khôi phục (bot gửi khi chạy lại)
```
🟢 BOT ĐÃ CHẠY LẠI
Ngừng: 14:10 → 15:02 21/11 (52 phút)
Hội thoại có tin bị sót: 37
• Bot đã trả lời: 29 (có câu xin lỗi trả lời muộn: 18)
• Sale đã trả lời tay, bot không chen: 5
• Bill xử lý bình thường: 3
• Chờ quá 23 giờ, đã chuyển sale: 0
```
Gửi khi đã xử lý xong toàn bộ tin bị sót (không gửi lúc vừa bật).

### A6. Sheet lỗi
Tab quan trọng:
```
🔴 SHEET LỖI – tab "2 Ưu đãi" (tab quan trọng)
Bot đang dùng bản cũ (đọc lúc 14:00) cho đến khi anh sửa.
• Dòng 7, cột "Giá sau ưu đãi (VND)": "1.990k" không phải số → ghi 1990000
• Dòng 9: khóa EDIT02 có 2 ưu đãi cùng hiệu lực
[📄 Mở Google Sheet]
```
Tab phụ:
```
🟡 SHEET LỖI – tab "3 FAQ" (tab phụ)
Đã bỏ qua 2 dòng lỗi, các dòng khác vẫn dùng.
• Dòng 14: thiếu "Câu trả lời chuẩn"
• Dòng 22: "Dùng" phải là Có hoặc Không
[📄 Mở Google Sheet]
```
Hết lỗi → 🟢 trả lời vào tin cũ: `Sheet đã hết lỗi – bot dùng bản mới từ 14:25`. Chỉ báo lại khi danh sách lỗi thay đổi. Tối đa 5 lỗi/tin, nhiều hơn ghi "và 7 lỗi khác".

### A7. Đồng bộ Sheet quá lâu
```
🟡 CHƯA ĐỌC ĐƯỢC SHEET từ 13:05 (60 phút)
Bot vẫn dùng bản đọc lúc 13:05.
Hay gặp: quyền Xem của bot bị gỡ, hoặc Google đang lỗi.
```
Ngưỡng lấy từ tab Cài đặt chung (đề xuất 30 phút = 6 lần đọc lỗi liền).

### A8. STK trong Sheet bị đổi
```
🔴 SỐ TÀI KHOẢN TRONG SHEET VỪA ĐỔI – cần anh xác nhận
Trang: MagentX.ai (Facebook)
Cũ: Vietcombank · 1234567890 · NGUYEN VAN A
Mới: Techcombank · 19033456789 · NGUYEN VAN A
Trước khi xác nhận: bot KHÔNG gửi STK, khách tới bước chuyển khoản sẽ được chuyển sale.
Không phải anh đổi? Sửa lại Sheet ngay và đổi mật khẩu Google.
[✅ Xác nhận STK mới]
```
- Chỉ quản trị bấm được (người khác thấy thông báo nhỏ "Chỉ quản trị được xác nhận").
- Bấm xong → sửa tin: `🟢 Đã xác nhận STK mới lúc 09:12 21/11 – bot gửi STK mới từ bây giờ`.
- Sheet lại đổi trước khi bấm → tin cũ chuyển `⚪ Đã có thay đổi mới hơn` (bỏ nút), gửi tin A8 mới.
- Hiện đủ STK vì đây là tài khoản nhận tiền của MagentX (không phải dữ liệu khách) và quản trị cần nhìn để đối chiếu.

### A8b. Đổi quyền hoặc nơi nhận tin trong Sheet (thêm sau review)
Cùng cơ chế A8 cho các thay đổi: thêm người **Quản trị**, đổi **Telegram ID** của quản trị, đổi **Mã nhóm Telegram sale**, cấp quyền **Được bấm "Tiền đã về"** cho người mới.
```
🔴 SHEET VỪA ĐỔI QUYỀN – cần anh xác nhận
• Thêm Quản trị: Tuấn (Telegram ID 5551234567)
• Đổi nhóm sale: -1001234567 → -1009876543
Trước khi xác nhận: bot vẫn dùng cài đặt cũ.
Không phải anh đổi? Sửa lại Sheet ngay và đổi mật khẩu Google.
[✅ Xác nhận thay đổi]
```
Lý do: nếu tài khoản Google bị lộ, kẻ xấu không thể tự cấp quyền hay chuyển tin báo đơn sang nhóm của họ. Bớt quyền (đặt Không, Đang làm = Không) có hiệu lực ngay, không cần xác nhận.

### A9. Thư viện media
```
🟡 THƯ VIỆN MEDIA: 3 file chưa gửi được
• edit_feedback_lam-nghe_02.jpg: không có file trong thư mục
• ai_showcase_quang-cao_01.mp4: video 22 MB (tối đa 15 MB)
• edit_demo_capcut_03.jpg: chưa có mô tả trong Sheet
```
Gửi lỗi 3 lần liền → thêm dòng `• …: gửi cho khách bị lỗi 3 lần, tạm ngừng dùng`. Chuẩn bị xong file mới: `🟢 Đã chuẩn bị xong 4 file mới – bot bắt đầu dùng`.

### A10. Sao lưu
- 🔴 `SAO LƯU LỖI lúc 14:00 – lý do: …. Bản tốt gần nhất: 12:00 21/11.`
- 🟡 `ĐÃ 4 GIỜ CHƯA CÓ BẢN SAO LƯU MỚI (bản gần nhất 10:00 21/11).`
- 🟡 `GOOGLE DRIVE GẦN ĐẦY – còn 1,2 GB (đủ khoảng 9 ngày sao lưu).`

### A11. Lỗi dồn dập
```
🔴 AI LỖI LIÊN TỤC – 12 lỗi trong 5 phút
Khách bị ảnh hưởng đã được chuyển sale im lặng.
Bot tự thử lại; hết lỗi sẽ báo.
```
(Tương tự với "PANCAKE LỖI LIÊN TỤC".)

### A12. Báo cáo sáng 8h00 (số liệu của ngày hôm qua)
```
📊 BÁO CÁO 20/11 (Thứ Năm)
Hội thoại mới: 312 · Bot tự xử lý: 74%
Chuyển sale: 81 (26%) – Bill 30 · Không có trong kho 19 · Giảm giá/trả góp 11 · Khác 21
Đơn: gửi STK 41 · có bill 28 · đã mua 25 (bot chốt 17)
Tiền đã xác nhận: 49.750.000đ
Còn treo: 13 đơn chưa chuyển khoản · 3 bill chưa ai bấm
Trả lời ≤ 5 giây: 96%
Chi phí AI: 72.300đ · tháng: 1.240.000đ / 3.000.000đ
Sự cố: bot ngừng 1 lần (52 phút) · Sheet lỗi 0 lần
```
Có thêm dòng "Chủ đề khách hỏi mà kho chưa có" nếu dữ liệu lý do chuyển người có ghi chi tiết (kiểm tra ở GĐ5).

### A13. Bảng chất lượng tuần – sáng thứ Hai 8h00
```
📋 CHẤT LƯỢNG – mốc chuyển lên máy chủ
Chuỗi ngày đạt liên tiếp: 9 / 14
✅ Sai giá/STK: 0 lần
✅ Chuyển sale: 26% (cần < 30%)
❌ Bot tự xử lý: 68% (cần ≥ 70%)
✅ Không qua kiểm tra: 1,2% (cần < 2%)
✅ Trả lời đúng thời gian: 96% (cần ≥ 95%)
✅ Ngừng > 15 phút mà không ai biết: 0
⏳ Đọc 30 hội thoại: anh chưa xác nhận
[✅ Đã đọc 30 hội thoại – ổn]
```
Bấm nút → ghi nhận ngày đọc; dòng cuối đổi thành ✅. Đủ 14 ngày → thêm dòng `🎉 ĐỦ ĐIỀU KIỆN chuyển lên máy chủ (GĐ9b)`.

---

## 5. Lệnh Telegram (chỉ quản trị, chỉ trong chat riêng)

| Lệnh | Bot làm gì |
|---|---|
| `/start` hoặc `/huongdan` | Danh sách lệnh, 1 dòng giải thích mỗi lệnh |
| `/tatbot` | Hiện nút chọn: `[MagentX.ai] [MagentX IG]` `[⛔ TẮT TẤT CẢ]`. **Bấm là tắt ngay**, không hỏi lại (vì là nút khẩn cấp, bật lại dễ). |
| `/batbot` | Hiện nút các trang đang bị tắt khẩn cấp; bấm → trang trở về chế độ đang ghi trong Sheet (Tắt/Thử nghiệm/Bật) |
| `/trangthai` | Tình trạng hiện tại (mẫu dưới) |
| `/baocao` | Báo cáo kiểu A12 cho hôm nay tính đến giờ hiện tại |

Sau khi `/tatbot`:
```
⛔ ĐÃ TẮT BOT – MagentX.ai lúc 21:05 21/11
Tin bot đang soạn dở đã hủy. Khách vẫn nhắn được, sale trả lời tay.
Đã báo nhóm sale. Bật lại: /batbot
```
Nhóm sale nhận: `⛔ Bot đã tắt trên MagentX.ai – sale trực inbox giúp`. Khi bật lại nhóm nhận: `🟢 Bot đã bật lại trên MagentX.ai`.
- Lệnh tắt khẩn cấp **thắng** cột Chế độ trong Sheet cho đến khi `/batbot`.
- Bật lại: bot **chỉ trả lời tin mới**, không quay lại trả lời tin trong lúc tắt (vì tắt có chủ đích, sale đã trực).

`/trangthai`:
```
🟢 BOT ĐANG CHẠY (từ 08:02 21/11)
MagentX.ai: Bật · MagentX IG: Thử nghiệm
Sheet đọc lúc: 14:25 (5 phút/lần)
Đang chờ: 2 bill chưa bấm · 13 đơn chưa chuyển khoản
Chi phí AI hôm nay: 41.200đ / 100.000đ
Sao lưu gần nhất: 14:00
```
- Người không phải quản trị gõ lệnh → `Lệnh này chỉ quản trị dùng được.`
- Người lạ (không có trong tab Nhân viên) nhắn bot → bot **không trả lời gì**.
- Gõ lệnh quản trị trong nhóm sale → `Dùng lệnh này trong chat riêng với bot.`
- Danh sách lệnh trong menu "/" chỉ hiện với quản trị.

---

## 6. "Người canh" bot bằng Google Apps Script (Q1)

**Vì sao cần**: bot Telegram chạy trên MacBook; MacBook tắt hoặc mất mạng thì bot không tự báo được. Người canh chạy trên máy chủ Google nên vẫn báo được.

**Cách làm (thiết kế, chưa tạo) – đã sửa sau review theo Q8 "bot tự gửi nhịp tim":**
1. Một dự án Apps Script **riêng** (không gắn trực tiếp vào Sheet) trong tài khoản Google của người dùng (đã bật 2FA), có một địa chỉ nhận nhịp tim.
2. **Mỗi phút, bot gửi nhịp tim ra người canh** (bot gọi ra ngoài, không ai gọi vào bot). Nhịp tim gồm: mã bí mật, giờ gửi, số việc đang chờ trong hàng, tin khách chưa được trả lời lâu nhất (phút). **Không chứa dữ liệu khách.** Nhịp tim do **phần xử lý tin** gửi (không phải phần web) → hàng chờ kẹt thì nhịp tim báo "đang kẹt".
3. Người canh kiểm tra 5 phút/lần. Báo ngừng khi **2 lần kiểm tra liên tiếp** không có nhịp tim mới trong 5 phút (tránh báo nhầm do mạng chập chờn) → gửi A4 cho quản trị; trong giờ trực gửi thêm S7 cho nhóm sale và người có "Nhận cảnh báo bot ngừng = Có". Nhịp tim vẫn đến nhưng báo "tin chưa trả lời lâu nhất > 10 phút" hoặc hàng chờ tăng liên tục → gửi cảnh báo 🔴 "BOT CÒN CHẠY NHƯNG KHÔNG XỬ LÝ TIN" cho quản trị.
4. Dùng **bot Telegram thứ hai "MagentX Canh"** (Q6) chỉ để gửi các tin này. Mã bot canh và mã bí mật nhịp tim lưu trong phần cài đặt bí mật của Apps Script, không ghi vào Sheet. Người nhận thêm bot canh vào nhóm sale và bấm Start một lần.
5. **Người canh lo trọn cặp tin S7 (ngừng) và S8 (chạy lại)** vì chỉ nó biết đã gửi S7 hay chưa; nó cũng nhắc lại A4 (30 phút, rồi mỗi 2 giờ). Bot chính chỉ gửi A5 (báo cáo khôi phục chi tiết) cho quản trị.
6. Ưu điểm so với cách "gọi vào bot": không tốn lượt của ngrok (gói miễn phí chỉ 20.000 lượt/tháng), không mở thêm địa chỉ kiểm tra ra Internet, chuyển lên Railway vẫn giữ nguyên.
7. Chi phí: 0đ. Khoảng 1.440 nhịp tim + 288 lần kiểm tra/ngày, nằm dưới giới hạn miễn phí của Google (kiểm lại ở GĐ5).

Thay đổi so với GĐ2: bỏ UptimeRobot.

---

## 7. Pancake – tag

### 7.1 Màu và ý nghĩa
Nhóm màu: **đỏ/cam/vàng = cần người làm gì đó**, **xanh lá = xong/tiền về**, **xanh dương/tím = thông tin khách**, **xám/đen = trạng thái bot, rác**. (Bảng màu Pancake có hạn, chọn màu gần nhất.)

| Tag | Màu | Ai gắn | Ai gỡ | Nhân viên gắn/gỡ tay thì sao |
|---|---|---|---|---|
| Cần người | Đỏ | Bot (khi chuyển sale) | Nhân viên | Gỡ → bot trả lời lại |
| Chờ xác nhận CK | Cam | Bot (khách gửi bill) | Bot (khi đã mua) | Gỡ → **không hủy**, báo nhóm sale (S10) |
| Chờ chuyển khoản | Vàng | Bot (sau khi gửi STK) | Bot (khi có bill) | Gỡ → hủy đơn (7.3) |
| Khách nóng | Hồng | Bot | Bot | Chỉ để nhìn |
| Đã mua | Xanh lá | Bot (bấm "Tiền đã về") / nhân viên | — | Gắn → **chỉ báo**, chờ người có quyền bấm "Tiền đã về" (S5) |
| Bot chốt | Xanh lá đậm | Bot | — | Chỉ để thống kê, không gắn tay |
| Quan tâm Edit | Xanh dương | Bot / nhân viên | — | Chỉ để nhìn |
| Quan tâm Video AI | Tím | Bot / nhân viên | — | Chỉ để nhìn |
| Đã có SĐT | Xanh ngọc | Bot | — | Chỉ để nhìn |
| Bot đang xử lý | Xám | Bot | Bot | Không gắn tay |
| Trả cho bot | Xanh lá nhạt | Nhân viên | **Bot tự gỡ** khi đã tiếp quản | Gắn → bot trả lời lại ngay |
| Thử bot | Nâu | Quản trị | Quản trị | Chỉ có tác dụng khi trang ở chế độ Thử nghiệm |
| Khách rác | Đen | Bot / nhân viên | — | Theo quy tắc GĐ3 |

### 7.2 Gợi ý cho sale khi nhìn Pancake trên điện thoại
- Thấy **đỏ** → vào xử lý ngay (đọc dòng "Chuyển sale vì" trong ghi chú).
- Thấy **cam** → kiểm tra tiền; người có quyền bấm "Tiền đã về" trên Telegram (gắn tag Đã mua chỉ để báo, không xác nhận được tiền).
- Thấy **vàng** → khách chưa chuyển khoản; muốn hủy thì gỡ tag vàng.

### 7.3 Hủy đơn bằng gỡ tag (Q2)
- Nhân viên gỡ tag **"Chờ chuyển khoản"** trong khi đơn đang Chờ chuyển khoản → đơn chuyển **Hủy**, lý do "nhân viên gỡ tag". Bot cập nhật ghi chú Pancake và báo nhóm sale (S6).
- Gỡ tag **"Chờ xác nhận CK"** → **không hủy**, đơn giữ trạng thái Chờ xác nhận, bot báo nhóm sale (S10).
- Bot tự gỡ tag (khi đổi trạng thái đơn) **không** tính là hủy.
- **Điều kiện hủy chặt (sau review)** – chỉ hủy khi đủ cả 4:
  1. Đọc trạng thái thật từ API Pancake, tag vắng mặt ở **2 lần đọc liên tiếp cách nhau ≥ 1 phút**;
  2. Trong 2 phút gần nhất bot không tự đổi tag của hội thoại này;
  3. Khách không gửi ảnh mới từ lúc tag biến mất (có thể là bill);
  4. Đơn vẫn đang Chờ chuyển khoản.
- **Đối chiếu định kỳ**: 10 phút/lần bot so tag trên Pancake với trạng thái đơn (lọc theo tag), để không phụ thuộc vào việc Pancake có báo sự kiện gắn/gỡ tag hay không.
- **Bill cho đơn đã hủy**: ảnh khách gửi trong **7 ngày** sau khi đã nhận STK (kể cả khi đơn đã hủy) đều coi là bill → câu `xac-nhan-bill` + chuyển sale + S1 có thêm dòng `⚠️ Đơn này đã hủy lúc 16:10 21/11 – kiểm tra kỹ`. Ảnh này không tính vào giới hạn 3 ảnh, AI không đọc.
- **Gỡ nhầm**: gắn lại đúng tag đó trong 24 giờ → đơn trở lại trạng thái cũ, **giữ nguyên mã đơn, không gửi lại STK**. Quá 24 giờ thì không khôi phục được.
- Đơn đã hủy mà khách vẫn chuyển tiền đúng mã → bot gửi S1 (có dòng cảnh báo đơn đã hủy); người có quyền bấm "Tiền đã về" → đơn mở lại thành Đã thanh toán.

---

## 8. Pancake – ghi chú khách

Mỗi khách có **1 ghi chú của bot**, bot sửa chính ghi chú đó (không tạo ghi chú mới mỗi lần). Nhân viên muốn ghi riêng thì tạo ghi chú khác — **không sửa ghi chú của bot** vì lần cập nhật sau bot sẽ ghi đè.

```
🤖 MagentX Bot · cập nhật 14:32 21/11/2026
SĐT: 0901234567
Quan tâm: Edit video cơ bản
Tóm tắt: Làm bán hàng online, chưa biết CapCut, hỏi lịch học tối.
Đơn: MGX7K2Q9P · Edit video cơ bản · 1.990.000đ
Trạng thái đơn: Chờ xác nhận CK (bill 14:32 21/11)
Chuyển sale vì: Khách gửi bill · 14:32 21/11
Đơn cũ: MGXA4B8C2 – Hủy (đổi khóa) 13:50 21/11
```
- Dòng nào chưa có thì bỏ, không để trống.
- SĐT viết liền, không cách (bấm vào gọi/copy dễ trên điện thoại). Đây là nơi **duy nhất** sale xem SĐT.
- "Tóm tắt": 1 câu từ hồ sơ khách do AI cập nhật, giúp sale nắm nhanh khi nhận khách (chuyển im lặng nên sale cần đọc nhanh). Không ghi thông tin nhạy cảm.
- "Đơn cũ": tối đa 3 đơn gần nhất.

---

## 9. Google Sheet mẫu "MagentX – Kho kiến thức Bot" (12 tab)

### 9.1 Cài đặt chung cho cả file
- Ngôn ngữ/vùng: **Việt Nam**; múi giờ **GMT+7**. Nhờ vậy tiền gõ `1990000` tự hiện `1.990.000` (giá trị bot đọc vẫn là 1990000).
- Tên tab có số đứng đầu: `0 Đọc trước`, `1 Khóa học`, … `11 Cài đặt chung`.
- **Màu tab**: Quan trọng = **đỏ** · Phụ = **xanh dương** · Đọc trước = **xanh lá**.
- **Dòng 1 (tên cột)**: chữ đậm, cố định khi cuộn, bảo vệ ở chế độ "hiện cảnh báo khi sửa" (chính chủ sửa cũng được hỏi lại). Màu nền tên cột: **cam đậm = bắt buộc điền**, **cam nhạt = không bắt buộc**, **xám = cột "Nội bộ" (bot không đọc)**.
- Cố định cột A (mã) để kéo ngang trên điện thoại vẫn thấy dòng nào.
- Cột chữ dài (Nội dung, Câu trả lời…) bật xuống dòng, rộng ~300px.
- Dòng **Dùng = Không** tự tô xám, chữ gạch ngang.
- **Mọi dòng ví dụ để Dùng = Không** và có chữ `VÍ DỤ` trong mã → không bao giờ lọt ra cho khách. Người dùng sửa thành dữ liệu thật rồi đổi Dùng = Có.
- Chia sẻ: người dùng = chủ; tài khoản của bot = **Người xem**; không ai khác có quyền sửa.

### 9.2 Từng tab

| Tab | Mức | Ô chọn sẵn (dropdown) | Định dạng / tô màu tự động | Dòng ví dụ |
|---|---|---|---|---|
| 0 Đọc trước | — | — | Chỉ chữ (9.3) | — |
| 1 Khóa học | Quan trọng | Loại: Khóa lẻ/Combo · Trạng thái: Đang bán/Sắp ra mắt/Ẩn · Hình thức: Online/Offline/Cả hai · Dùng: Có/Không | Giá gốc: số tiền. Trạng thái Ẩn → tô xám. Gồm khóa chỉ điền khi Loại = Combo (sai → tô đỏ) | VIDU-EDIT01 · Khóa lẻ · Edit video cơ bản · Đang bán · 1990000 · Online · Dùng = Không |
| 2 Ưu đãi | Quan trọng | Áp dụng cho mã khóa: lấy từ cột Mã khóa tab 1 · Dùng | Bắt đầu/Kết thúc: dd/mm/yyyy hh:mm, phải là ngày hợp lệ. Đang hiệu lực → tô xanh lá; đã hết → tô xám; 2 ưu đãi cùng khóa cùng lúc → tô đỏ | VIDU-UD01 · VIDU-EDIT01 · Ưu đãi tháng 12 · 1490000 · 01/12/2026 00:00 · 31/12/2026 23:59 |
| 3 FAQ | Phụ | Dùng nguyên văn: Có/Không · Dùng | Cách hỏi khác ngăn bằng dấu ; | VIDU-FAQ01 · Lịch học · Học online xem lại được không? |
| 4 Chính sách | Phụ | Bot xử lý: Tự trả lời/Chuyển người · Dùng | — | VIDU-CS01 · Hoàn tiền · Chuyển người |
| 5 Chuyển khoản | Quan trọng | Áp dụng cho trang: lấy từ Mã trang tab 9 · Dùng | Số TK định dạng **chữ** (giữ số 0 đầu). Mẫu nội dung CK thiếu `{ma_don}` → tô đỏ | VIDU · Vietcombank · 970436 · 0000000000 · NGUYEN VAN A · `{ma_don}` |
| 6 Câu mẫu | Phụ | Loại: Bot dùng/Trả lời tự động QC · Dùng | `gui-stk` thiếu `{thong_tin_ck}` → tô đỏ. 5 câu bắt buộc đặt sẵn ở 5 dòng đầu | 5 câu ở mục 2.2 |
| 7 Thư viện media | Phụ | Mã khóa: lấy từ tab 1 · Loại: feedback/showcase/demo · Dùng | Tên file sai mẫu `khoa_loai_chude_so` → tô đỏ | edit_feedback_vidu_01.jpg |
| 8 Từ khóa | Phụ | Hành động: Chuyển người im lặng/Câu từ chối mẫu · Mã lý do (dropdown 16 mã, hiện kèm tên tiếng Việt) · Dùng | — | "hoàn tiền" · Khiếu nại · Chuyển người im lặng · complaint_refund |
| 9 Cài đặt trang | Quan trọng | Nền tảng: Facebook/Instagram · Trang thử nghiệm: Có/Không · Chế độ: Tắt/Thử nghiệm/Bật · Xưng hô: mình – bạn / em – anh/chị | Chế độ Bật → xanh lá, Thử nghiệm → vàng, Tắt → xám. Giờ trực: hh:mm | 3 dòng: fanpage thử nghiệm, MagentX.ai, MagentX IG – **Chế độ = Tắt**. Không đưa Zalo cá nhân vào |
| 10 Nhân viên | Quan trọng | Quản trị / Được bấm "Tiền đã về" / Nhận cảnh báo bot ngừng / Đang làm: Có/Không | Telegram ID định dạng chữ | VIDU-Sale A · Đang làm = Không |
| 11 Cài đặt chung | Quan trọng | — | Giá trị ngoài "Giới hạn hợp lệ" → tô đỏ | Đủ các dòng mặc định (9.4) |

### 9.3 Nội dung tab "0 Đọc trước" (chữ đặt sẵn)
1. Tab **đỏ** là tab quan trọng: điền sai thì bot **giữ nguyên bản cũ của cả tab** và báo Telegram. Sửa xong, tối đa 5 phút bot dùng bản mới.
2. Tab **xanh dương** là tab phụ: dòng sai bị bỏ qua, các dòng khác vẫn dùng.
3. **Không đổi tên, không đổi thứ tự cột ở dòng 1, không chèn cột vào giữa.** Thêm dữ liệu thì thêm dòng ở dưới.
4. Muốn tắt một dòng: đổi **Dùng = Không**. Đừng xóa dòng.
5. Tiền gõ số liền: `1990000`. Không gõ "1.990k", "2tr".
6. Ngày giờ: `21/11/2026 08:00`.
7. Ô cam đậm ở dòng 1 = bắt buộc điền. Cột xám "Nội bộ…" bot không đọc, ghi chú thoải mái.
8. Ô bị tô đỏ = đang sai, sửa trước khi đổi Dùng = Có.
9. Đổi số tài khoản: bot **ngừng gửi STK** cho tới khi anh bấm "Xác nhận STK mới" trên Telegram.
10. Muốn chắc bot đã đọc bản mới: gõ `/trangthai` trên Telegram, xem dòng "Sheet đọc lúc".
11. Các dòng có chữ VÍ DỤ đang để Dùng = Không, sửa thành dữ liệu thật rồi mới đổi Dùng = Có.
12. Không chia sẻ quyền sửa file này cho người khác.
13. Nhân viên nghỉ việc: đặt **Đang làm = Không** ngay (có hiệu lực tức thì) và xóa họ khỏi nhóm Telegram sale.
14. Thêm Quản trị, cấp quyền "Tiền đã về", đổi Telegram ID quản trị hoặc mã nhóm sale: bot chờ anh bấm xác nhận trên Telegram rồi mới áp dụng.

Kèm bảng nhỏ: tên tab · mức (Quan trọng/Phụ) · dùng để làm gì (1 dòng).

### 9.4 Dòng mới thêm vào tab "11 Cài đặt chung" (do GĐ4)
| Tên | Giá trị mặc định | Giới hạn hợp lệ |
|---|---|---|
| Giờ gửi báo cáo sáng | 08:00 | 06:00–12:00 |
| Ngày gửi bảng chất lượng tuần | Thứ Hai | Thứ Hai–Chủ nhật |
| Số hội thoại tối thiểu để cảnh báo chuyển người | 20 | 5–200 |
| Ngưỡng báo đồng bộ Sheet quá lâu (phút) | 30 | 10–240 |
| Thời gian khôi phục đơn khi gắn lại tag (giờ) | 24 | 1–72 |
| Giờ im lặng thông báo Telegram | 22:00–08:00 | — |
| Mã nhóm Telegram sale | (điền ở GĐ5) | — |
| Phút chờ sale trước khi nhắc (S11) | 15 | 5–120 |
| Số ngày coi ảnh là bill sau khi gửi STK | 7 | 1–30 |

(Nếu GĐ3 đã có dòng tương đương thì dùng dòng cũ, không thêm trùng.)

---

## 10. Thay đổi so với GĐ1–3

| # | Thay đổi | Ảnh hưởng |
|---|---|---|
| 1 | Bỏ UptimeRobot → người canh Google Apps Script + bot Telegram thứ hai "MagentX Canh" | Kiến trúc GĐ2 (phần giám sát). Miễn phí. |
| 2 | Cách nhân viên hủy đơn: gỡ tag "Chờ chuyển khoản"; gắn lại trong 24 giờ để khôi phục. Gỡ "Chờ xác nhận CK" chỉ báo sale | Database: thêm lý do hủy "nhân viên gỡ tag", lưu thời điểm hủy để khôi phục |
| 3 | Biến mới `{thong_tin_ck}` bắt buộc trong câu mẫu `gui-stk`; tin STK = 2 tin; "đã gửi STK" tính theo tin chữ | Tab Câu mẫu, bước gửi STK |
| 4 | 7 dòng mới trong Cài đặt chung (9.4) | Tab 11 |
| 5 | Tag "Trả cho bot" được bot tự gỡ khi tiếp quản | Quy tắc tag |
| 6 | Ghi chú Pancake có thêm dòng "Tóm tắt" và "Chuyển sale vì" | Bước ghi ghi chú |
| 7 | Lệnh mới: `/trangthai`, `/baocao`, `/huongdan`; nút "Đã đọc 30 hội thoại" | Telegram, bảng chất lượng |
| 8 | Bật lại bot sau `/tatbot` chỉ trả lời tin mới, không gửi danh sách (Q9) | Khác với khôi phục sau sự cố (sự cố thì trả lời tin sót) |
| 9 | Tag "Đã mua" gắn tay chỉ báo, không xác nhận (Q7) | Bỏ `confirm_channel = pancake_tag` ở GĐ3; xác nhận chỉ qua Telegram |
| 10 | Người canh: bot đẩy nhịp tim ra Apps Script; người canh gửi S7 + S8 (Q8) | Bỏ địa chỉ kiểm tra sức khỏe công khai |
| 11 | Tin mới S11 (khách chờ sale > 15 phút, chỉ trong giờ trực) | Thực hiện cảnh báo `bot_silent`/khách bị bỏ rơi của GĐ2–3 |
| 12 | A8b: xác nhận khi đổi quyền/nơi nhận tin trong Sheet | Bảng thay đổi chờ duyệt |
| 13 | Chỉ số chuyển người và "bot tự xử lý" không tính khách gửi bill | Sửa định nghĩa chỉ số trong PRD |
| 14 | Điều kiện hủy chặt + đối chiếu tag 10 phút/lần + ảnh trong 7 ngày coi là bill | Luồng đơn |
| 15 | 2 dòng mới trong Cài đặt chung (9.4) | Tab 11 |

---

## 13. Quy tắc kỹ thuật bắt buộc (thêm sau review 21/11)

**An toàn khi nhận tin báo từ Pancake**
- Tin báo (webhook) của Pancake **không có chữ ký** → chỉ coi là "chuông gọi". Trước mọi thay đổi trạng thái đơn hay dừng/tiếp tục bot, code **đọc lại trạng thái thật qua API Pancake**. Không bao giờ đổi đơn chỉ dựa vào nội dung webhook.
- Địa chỉ nhận webhook có thêm một đoạn mã bí mật dài; sai mã → bỏ qua, ghi nhật ký.

**Telegram**
- Bot chính dùng cách **tự hỏi Telegram** (long polling, bot gọi ra ngoài), không nhận webhook qua ngrok.
- Mọi chữ do khách hoặc Sheet cung cấp (tên khách, tên khóa, lý do) phải **làm sạch ký tự đặc biệt** trước khi chèn vào tin có định dạng. Telegram từ chối tin → gửi lại dạng chữ thường → vẫn lỗi → thử lại theo hàng chờ và báo quản trị. **Tin S1 không được phép mất.**
- Nút bấm chỉ mang mã đơn; quyền luôn kiểm tra lại ở phía bot theo Telegram ID trong tab Nhân viên. Thêm thông báo nhỏ cho các trường hợp: đơn đã hủy, đơn đã được xác nhận.
- Lệnh `/tatbot` xử lý ngay, **không xếp hàng** sau các việc khác. Trạng thái tắt được kiểm tra **ngay trước mỗi lần gửi tin cho khách**.
- Giới hạn tốc độ gửi vào nhóm (≤ 20 tin/phút); vượt thì gộp tin.

**Gửi STK**
- Gửi lần lượt: chờ ảnh QR gửi xong (tối đa 5 giây) rồi mới gửi tin chữ; ảnh quá 5 giây hoặc lỗi → bỏ ảnh, vẫn gửi tin chữ.

**Đọc Google Sheet**
- Đọc **giá trị gốc**, không đọc chữ đang hiển thị (Sheet vùng Việt Nam hiện `1.990.000` nhưng giá trị là `1990000`). Ngày giờ đổi từ dạng số của Sheet sang GMT+7.
- Chuẩn hóa chữ tiếng Việt có dấu (NFC) trước khi so tên cột, tên tab, giá trị dropdown.
- Ô chọn sẵn trong Sheet chỉ để hỗ trợ; dán dữ liệu vẫn vượt qua được → **kiểm tra của bot là chốt chặn cuối**. Quy tắc kiểm tra từng cột viết ở một chỗ trong code; tô màu trong Sheet làm theo cùng danh sách đó.
- **Kiểm tra câu mẫu**: câu mẫu (đặc biệt `gui-stk`) có dãy từ 6 chữ số trở lên, hoặc con số kèm đơn vị tiền (k, nghìn, tr, triệu, đ, đồng, vnd, %) nằm ngoài chỗ trống giá → không hợp lệ, báo A6. Tránh việc lỡ gõ STK cũ hoặc giá cũ vào câu mẫu.

**Ghi chú Pancake**
- Dòng "Tóm tắt" do AI viết: tối đa 150 ký tự, bỏ link và dãy số. Chỉ gọi Pancake sửa ghi chú khi nội dung thật sự thay đổi.

**Dữ liệu cá nhân**
- Tên khách đầy đủ hiển thị trên Telegram (Q10). Ghi Telegram vào danh sách bên xử lý dữ liệu (cùng Claude, Pancake) khi rà pháp lý ở GĐ7.

---

## 11. Cần thử ở GĐ5 (thêm vào danh sách của GĐ2)
- Pancake webhook có báo sự kiện **gắn/gỡ tag** không, và có phân biệt bot gỡ hay nhân viên gỡ không (cần cho hủy đơn, "Đã mua", "Trả cho bot").
- Pancake API sửa được **một ghi chú** đã có (không chỉ thêm mới).
- Mẫu đường link mở hội thoại Pancake cho nút "💬 Mở hội thoại".
- Ảnh QR SePay: chọn mẫu ảnh rõ trên Messenger/Instagram.
- Bot gửi nhịp tim tới Apps Script mỗi phút ổn định; hạn mức miễn phí của Apps Script đủ cho 1.440 lần/ngày.
- Webhook Pancake có cho đặt địa chỉ dài có mã bí mật không.
- API Pancake lọc hội thoại theo tag để đối chiếu 10 phút/lần.
- Thông báo nhỏ khi bấm nút Telegram hiện đúng trên điện thoại.

---

## 12. Điểm còn chờ người dùng
1. Xác nhận toàn bộ thiết kế trên (hoặc sửa chỗ nào). Q5–Q10 đã trả lời ngày 21/11; các điểm review đã đưa vào mục 3, 4, 6, 7, 9, 10, 13.
2. Nội dung thật của 5 câu mẫu bắt buộc: người dùng tự soạn, có thể làm song song trước GĐ9.
3. Đơn đã có bill nhưng không bao giờ được xác nhận (ví dụ bill giả) hiện không có cách hủy, chỉ nằm trong báo cáo sáng. Nếu sau này cần, thêm cách hủy riêng (ví dụ nút trên Telegram) — không bắt buộc cho MVP.
