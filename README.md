# LionRail — Đặt vé tàu trực tuyến

Monorepo gồm API NestJS + Prisma (MySQL) tại `apps/api` và web Next.js tại `apps/web`.

## Trang quản trị

Đường dẫn: `/admin` — chỉ tài khoản role `ADMIN` vào được (tài khoản mẫu từ seed: `admin@train.com`).
Khi đã đăng nhập bằng ADMIN, thanh điều hướng có thêm nút **Quản trị**.

| Trang | Việc làm được |
|---|---|
| Tổng quan | Doanh thu 7/30/90 ngày, vé đã bán, đơn chờ thanh toán, chuyến hôm nay, top tuyến, chuyến 24h tới |
| Đơn đặt vé | Lọc theo trạng thái, tìm mã đơn/SĐT/email, xem chi tiết hành khách–ghế–thanh toán, hủy đơn |
| Chuyến tàu | Tạo chuyến (giờ đến và giờ từng ga tự tính từ tuyến), đổi giờ/trạng thái, hủy hoặc xóa |
| Ga | Thêm, sửa, xóa ga |
| Tàu & toa | Thêm tàu, thêm toa theo loại (ghế mềm 10 chỗ, khoang 4, khoang 6 — ghế tự sinh), xóa toa |
| Tuyến | Thêm tuyến, khai báo ga dừng (phút đến/đi tính từ giờ xuất phát, km từ ga đầu) |
| Bảng giá | Giá gốc theo tuyến × loại ghế, % giảm cho trẻ em / sinh viên / người cao tuổi |
| Người dùng | Tìm, lọc, khóa/mở khóa, đổi vai trò |

### Mở bán một chuyến mới

1. **Ga** — đảm bảo các ga của tuyến đã có.
2. **Tuyến** — tạo tuyến, rồi thêm ít nhất 2 ga dừng (ga đầu: thứ tự 1, phút 0, km 0).
3. **Bảng giá** — đặt giá cho các loại ghế của tuyến.
4. **Tàu & toa** — tạo tàu và thêm toa.
5. **Chuyến tàu** — chọn tuyến, tàu, giờ khởi hành. Khách tìm thấy chuyến ngay ở trang chủ và trang tìm kiếm.

### Quy tắc bảo toàn dữ liệu

- Tạo chuyến bị từ chối nếu tuyến chưa có đủ ga dừng hoặc tàu chưa có toa.
- Chuyến đã có vé thì không đổi được giờ, tuyến hay tàu.
- Xóa ga / tàu / tuyến đang được dùng sẽ chuyển sang *ngừng hoạt động*; xóa chuyến đã có đơn sẽ chuyển sang *đã hủy*.
- Không xóa được toa có ghế đã nằm trong đơn.
- Mọi API quản trị kiểm tra quyền `ADMIN` ở server (`@Roles(Role.ADMIN)`); chặn ở giao diện chỉ để tiện dùng.
