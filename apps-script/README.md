# Người canh bot – Google Apps Script

Người canh chạy trên máy chủ Google. MacBook tắt, mất mạng hay ứng dụng bot treo thì người canh
vẫn báo được qua bot Telegram thứ hai **"MagentX Canh"**. Chi phí 0đ. Thiết kế: tài liệu GĐ4 mục 6.

## Cách hoạt động (tóm tắt)
- Bot chính gửi **nhịp tim** mỗi phút tới địa chỉ của người canh (không chứa dữ liệu khách).
- Người canh kiểm tra 5 phút/lần. **2 lần liên tiếp** không có nhịp tim mới → gửi **A4** cho quản trị
  (24/7), và **S7** cho nhóm sale + người có "Nhận cảnh báo bot ngừng = Có" (chỉ trong 8h–22h).
- Bot có nhịp tim lại → gửi **S8** cho nhóm sale. Nhắc lại A4 sau 30 phút, rồi mỗi 2 giờ.
- Nhịp tim vẫn đến nhưng tin chưa trả lời lâu nhất > 10 phút hoặc hàng chờ tăng liên tục
  → báo 🔴 "Bot còn chạy nhưng không xử lý tin" cho quản trị.

## Cài đặt từng bước (anh/chị tự làm, khoảng 15 phút)

### Bước 1 – Tạo bot Telegram "MagentX Canh"
1. Mở Telegram, tìm **@BotFather**, gửi `/newbot`.
2. Tên hiển thị: `MagentX Canh`. Tên đăng nhập: ví dụ `magentx_canh_bot` (phải kết thúc bằng `bot`).
3. BotFather trả về một **token** (dãy chữ số và chữ). **Không dán token vào chat với Claude.**
   Token này chỉ điền vào Apps Script ở bước 3.
4. Bấm **Start** với bot vừa tạo. Thêm bot vào **nhóm Telegram sale**, nhắn một câu bất kỳ trong nhóm.

### Bước 2 – Tạo dự án Apps Script
1. Vào https://script.google.com (đăng nhập tài khoản Google đã bật 2FA) → **Dự án mới**.
2. Đặt tên dự án: `MagentX Nguoi Canh` (bấm vào chữ "Dự án không có tiêu đề" để đổi).
3. Xóa hết nội dung trong file `Code.gs`, mở file `apps-script/nguoi-canh.gs` trong kho này,
   chép toàn bộ rồi dán vào. Bấm biểu tượng **Lưu** (hoặc ⌘S).

### Bước 3 – Điền phần bí mật (Script Properties)
1. Bên trái bấm biểu tượng **bánh răng (Cài đặt dự án)** → kéo xuống **Thuộc tính tập lệnh** →
   **Thêm thuộc tính tập lệnh**. Thêm từng dòng:

| Thuộc tính | Giá trị |
|---|---|
| `HEARTBEAT_SECRET` | Một dãy ngẫu nhiên dài ≥ 24 ký tự do anh/chị tự gõ. Sau đó điền **đúng dãy này** vào `HEARTBEAT_SECRET` trong file `.env` trên MacBook. |
| `CANH_BOT_TOKEN` | Token của bot "MagentX Canh" (bước 1) |
| `ADMIN_CHAT_ID` | Telegram ID của quản trị (xem bước 5) |
| `SALE_GROUP_ID` | Mã nhóm Telegram sale, thường là số âm bắt đầu bằng `-100` (xem bước 5) |
| `DOWNTIME_IDS` | (tùy chọn) Telegram ID của người có "Nhận cảnh báo bot ngừng = Có", cách nhau bằng dấu phẩy |
| `STAFF_HOURS_START` / `STAFF_HOURS_END` | (tùy chọn) mặc định `8` và `22` |

2. Bấm **Lưu thuộc tính tập lệnh**.

### Bước 4 – Triển khai dạng web app (để nhận nhịp tim)
1. Góc trên bên phải: **Triển khai** → **Tạo quá trình triển khai mới**.
2. Bấm bánh răng cạnh "Chọn loại" → **Ứng dụng web**.
3. Mô tả: `nguoi canh`. **Thực thi dưới dạng**: *Tôi*. **Ai có quyền truy cập**: *Bất kỳ ai*.
   (Địa chỉ dài và khó đoán; nhịp tim còn có mã bí mật riêng nên người lạ không làm gì được.)
4. Bấm **Triển khai** → cho phép quyền khi Google hỏi (chọn tài khoản → Nâng cao → Đi tới… → Cho phép).
5. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`) → điền vào
   `HEARTBEAT_URL` trong file `.env` trên MacBook.
6. Mỗi lần sửa code sau này: **Triển khai → Quản lý quá trình triển khai → bút chì → Phiên bản: Mới → Triển khai**
   (URL giữ nguyên).

### Bước 5 – Lấy chat_id, thử gửi tin, đặt lịch
1. Nhắn `xin chào` cho bot "MagentX Canh" trong chat riêng và trong nhóm sale.
2. Trong trình soạn thảo Apps Script, chọn hàm **`layChatId`** ở thanh trên → **Chạy**.
   Mở **Nhật ký thực thi**: thấy các dòng `chat_id … = Tên (private/supergroup)`.
   Điền số của chat riêng vào `ADMIN_CHAT_ID`, số của nhóm (số âm) vào `SALE_GROUP_ID` (bước 3), lưu.
3. Chọn hàm **`thuGuiTin`** → **Chạy** → điện thoại phải nhận tin "🟢 Người canh MagentX đã nối được Telegram".
4. Chọn hàm **`caiDatLichKiemTra`** → **Chạy** một lần → đã có lịch kiểm tra 5 phút/lần
   (xem ở biểu tượng **đồng hồ – Trình kích hoạt** bên trái).

### Bước 6 – Bật nhịp tim ở bot chính
Trên MacBook, file `.env` đã có `HEARTBEAT_URL` và `HEARTBEAT_SECRET` → khởi động lại bot
(`npm run dev`). Log phải hiện "Nhịp tim: mỗi phút → người canh Apps Script".
Sau 2–3 phút, chạy hàm **`xemTrangThai`** trong Apps Script: `lastHeartbeatAt` phải là giờ vừa rồi.

## Phép thử (GĐ5 – C1, C2)
- **C1**: để bot chạy 2 giờ → `xemTrangThai` cho `heartbeatCountToday` ≈ số phút đã chạy.
- **C2**: tắt bot (Ctrl+C) khoảng 12 phút → quản trị nhận **A4**, nhóm sale nhận **S7** (nếu trong giờ trực);
  bật lại bot → nhóm sale nhận **S8**.

## Hạn mức miễn phí của Google (kiểm lại ở GĐ5)
Tài khoản Google thường: web app nhận không giới hạn đáng kể; **UrlFetch** (gửi Telegram) 20.000 lượt/ngày;
tổng thời gian chạy trigger 90 phút/ngày. Người canh dùng ≈ 288 lần kiểm tra/ngày × vài giây → rất xa hạn mức.
