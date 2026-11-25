# Kết quả phép thử trên tài khoản thật – Giai đoạn 5

Ghi dần trong lúc làm. Cột **Kết quả**: Đạt / Không đạt / Chưa thử. Cột **Ảnh hưởng GĐ6**: điều GĐ6 phải làm theo.
Fanpage thử: (điền tên/ID). Ngày bắt đầu thử: (điền).

## Nhóm A – Pancake (webhook và API)

| # | Phép thử | Kết quả | Số đo / ghi chú | Ảnh hưởng GĐ6 |
|---|---|---|---|---|
| A1 | Webhook nhận tin + độ trễ | Chưa thử | | |
| A2 | Webhook có báo tin nhân viên gửi không | Chưa thử | | |
| A3 | Phân biệt tin bot / nhân viên / trả lời tự động quảng cáo | Chưa thử | | |
| A4 | Webhook báo gắn/gỡ tag, và ai gỡ | Chưa thử | | |
| A5 | Webhook đặt được địa chỉ dài có mã bí mật | Chưa thử | | |
| A6 | API lọc hội thoại theo tag | Chưa thử | | |
| A7 | API sửa ghi chú đã có | Chưa thử | | |
| A8 | Mẫu link mở hội thoại Pancake | Chưa thử | | |
| A9 | Ảnh QR SePay hiển thị trên Messenger và Instagram | Chưa thử | | |
| A10 | Tải trước ảnh/video lên Pancake, gửi bằng mã | Chưa thử | | |
| A11 | Giới hạn gọi API khi dồn dập | Chưa thử | | |
| A12 | Lỗi khi gửi ngoài 24 giờ | Chưa thử | | |

## Nhóm B – Telegram

| # | Phép thử | Kết quả | Ghi chú | Ảnh hưởng GĐ6 |
|---|---|---|---|---|
| B1 | Thông báo nhỏ khi bấm nút trên điện thoại | Chưa thử | | |
| B2 | Bot chỉ trả lời ID quản trị, người lạ im lặng | Chưa thử | | |

## Nhóm C – Người canh Apps Script

| # | Phép thử | Kết quả | Ghi chú | Ảnh hưởng GĐ6 |
|---|---|---|---|---|
| C1 | Nhịp tim mỗi phút ổn định, trong hạn mức miễn phí | Chưa thử | | |
| C2 | Tắt bot → A4 + S7; bật lại → S8 | Chưa thử | | |

## Nhóm D – Vận hành trên Mac

| # | Phép thử | Kết quả | Ghi chú | Ảnh hưởng GĐ6 |
|---|---|---|---|---|
| D1 | ngrok ổn định qua đêm | Chưa thử | | |
| D2 | Tắt/bật bot nhặt đủ tin sót, không ghi trùng (phần nhận tin) | Chưa thử | | |
| D3 | Sao lưu và khôi phục | Chưa thử | | |

## Đã thử trong máy (không cần tài khoản thật) – 25/11/2026
| Việc | Kết quả |
|---|---|
| Webhook sai mã / địa chỉ lạ → 404; đúng mã → 200, sự kiện vào hàng chờ và xử lý xong | Đạt |
| Nhịp tim mỗi phút ghi `last_heartbeat_at` vào database | Đạt |
| Migration chạy 2 lần, lần 2 không làm gì; 18 bảng | Đạt |
| Quyền `bot_app`: đọc/ghi, không xóa đơn, xóa được bảng nhật ký; `backup_reader` chỉ đọc | Đạt |
