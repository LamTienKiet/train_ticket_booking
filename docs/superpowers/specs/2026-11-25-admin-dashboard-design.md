# Trang quản trị (Admin) — Thiết kế

Ngày: 2026-11-25 · Nhánh: `feat/core-booking`

## Mục đích

LionRail đang chỉ có phía khách hàng. Cần trang quản trị để ADMIN tự vận hành hệ thống
(thêm ga, tàu, tuyến, giá, chuyến; xem đơn và người dùng) mà không phải sửa seed.
Lý do chính: hoàn thiện project để đưa vào CV — người xem bấm thử được luồng
"admin tạo chuyến mới → khách tìm thấy và đặt được vé".

## Mục tiêu

- Khu vực `/admin` trong app web hiện có, chỉ tài khoản role `ADMIN` vào được.
- Các trang: Tổng quan, Đơn đặt vé, Chuyến tàu, Ga, Tàu (kèm toa), Tuyến (kèm ga dừng), Bảng giá, Người dùng.
- Một chuyến tạo từ admin phải **đặt vé được thật** (có ga dừng, có toa và ghế, có giá).

## Không làm

- Phân quyền STAFF riêng (để sau; STAFF hiện không vào được `/admin`).
- Sửa sơ đồ ghế từng ghế, quản lý mã giảm giá, hoàn tiền, soát vé.
- Thư viện UI/biểu đồ mới.

## Anti-goal

- Có màn hình tạo được dữ liệu "hỏng" mà khách không đặt được (tàu không toa, chuyến không ga dừng) — coi như thất bại.
- Xóa cứng dữ liệu đã có đơn đặt vé.

## Hướng làm (đã chọn: 1)

1. **Tự viết bằng CSS Modules + bộ component admin dùng chung** — *đã chọn*. Không thêm thư viện,
   đồng bộ với phần web hiện có, toàn bộ là code tự viết (có giá trị khi phỏng vấn).
2. Thêm thư viện UI (Tailwind/shadcn, MUI) — nhanh đẹp nhưng hai hệ style song song, bundle nặng.
3. react-admin — CRUD gần như tự động nhưng cần lớp chuyển đổi API, ít code của mình để kể.

## Phần API cần thêm/sửa (NestJS)

Hầu hết CRUD đã có (`@Roles(ADMIN)`): stations, trains, routes (+ `POST/DELETE :id/stations`),
fares (+ passenger-fares), trips, users. Cần bổ sung:

1. **Thêm toa cho tàu** — `POST /trains/:id/coaches` `{ kind: 'SOFT' | 'K4' | 'K6' }`.
   Tự gán `coachNumber` kế tiếp và sinh ghế theo đúng quy tắc trong `prisma/seed.ts` (`seatsOf`).
   Tách `seatsOf` ra file dùng chung để seed và service cùng dùng.
   `DELETE /trains/:id/coaches/:coachId` — chặn nếu ghế của toa đã có trong đơn.
   `GET /trains/:id` trả kèm danh sách toa + số ghế.
2. **Tạo chuyến sinh ga dừng** — `TripService.create` đọc `routeStations` của tuyến và tạo
   `tripStations` với giờ = `departureTime + offset`. `arrivalTime` bỏ khỏi input bắt buộc,
   tính từ offset của ga cuối (nếu client gửi thì bỏ qua). Chặn tạo nếu tuyến chưa có ga dừng
   hoặc tàu chưa có toa. `update` đổi `departureTime` thì dời toàn bộ `tripStations` tương ứng.
3. **Danh sách chuyến cho admin** — `GET /trips/admin?status=&from=&to=&page=` (ADMIN): mọi trạng thái,
   kể cả đã chạy/hủy, kèm số ghế đã bán / tổng ghế. (Không đổi `GET /trips` công khai.)
4. **Danh sách đơn** — `GET /bookings/admin?status=&search=&page=` (ADMIN): tìm theo mã đơn, SĐT, email;
   trả mã đơn, chuyến, số vé, tổng tiền, trạng thái, ngày tạo. Hủy đơn dùng lại
   `POST /bookings/:code/cancel` (đã cho ADMIN qua `assertBookingAccess`).
5. **Số liệu tổng quan** — `GET /admin/stats?days=30` (ADMIN): doanh thu (payment SUCCESS),
   số vé bán, số đơn theo trạng thái, doanh thu theo ngày, top 5 tuyến theo doanh thu, chuyến sắp chạy hôm nay.
6. **Xóa an toàn** — ga/tàu/tuyến/chuyến đang được tham chiếu thì chuyển `INACTIVE`/`CANCELLED`
   hoặc trả 409 với thông báo tiếng Việt, không xóa cứng. Hủy chuyến có đơn → chỉ đổi trạng thái chuyến.

Mỗi phần mới có unit test (theo kiểu các `*.spec.ts` hiện có): sinh ghế theo loại toa,
sinh `tripStations` từ offset, chặn tạo chuyến thiếu toa/ga, tính stats.

## Phần web (Next.js, CSS Modules)

### Khung & bảo vệ
- `app/admin/layout.tsx`: client guard đọc `authService.getCurrentUser()`; không phải `ADMIN` → chuyển `/login?next=/admin`.
  (API vẫn là lớp chặn thật bằng `@Roles`; guard web chỉ để UX.)
- Sidebar trái (thu gọn thành menu trên mobile) + header nhỏ có tên admin, link "Về trang khách".
- Navbar khách hiện thêm link "Quản trị" khi role là ADMIN.

### Component dùng chung (`app/admin/_components/`)
- `DataTable` — cột khai báo, ô tìm kiếm, bộ lọc, phân trang, trạng thái loading/rỗng/lỗi.
- `FormModal` — hộp thoại thêm/sửa, nhận danh sách field (text, number, select, datetime), hiện lỗi từ API (`apiErrorMessage`).
- `ConfirmDialog` — xác nhận xóa/hủy.
- `StatusBadge`, `StatCard`, `BarChart` (SVG tự vẽ).
- Dùng token màu giống trang khách (`--primary`, `--accent`…).

### Các trang
| Trang | Nội dung |
|---|---|
| Tổng quan `/admin` | 4 thẻ số (doanh thu, vé bán, đơn chờ thanh toán, chuyến hôm nay), biểu đồ doanh thu 30 ngày, top tuyến, chuyến sắp chạy |
| Đơn `/admin/bookings` | Bảng + lọc trạng thái + tìm; bấm dòng → panel chi tiết (hành khách, ghế, thanh toán) + nút Hủy |
| Chuyến `/admin/trips` | Bảng + lọc; Thêm chuyến: chọn tuyến, tàu, giờ đi → xem trước giờ đến & ga dừng; đổi trạng thái; link "Xem như khách" |
| Ga `/admin/stations` | CRUD (mã, tên, thành phố, địa chỉ, trạng thái) |
| Tàu `/admin/trains` | CRUD tàu; trang chi tiết tàu: danh sách toa, thêm toa theo loại, xóa toa |
| Tuyến `/admin/routes` | CRUD tuyến; chi tiết tuyến: danh sách ga dừng (thứ tự, phút đến/đi tính từ ga đầu, km) thêm/xóa |
| Giá `/admin/fares` | Bảng giá theo tuyến × loại ghế; sửa giá gốc và % giảm theo đối tượng |
| Người dùng `/admin/users` | Bảng + lọc role/trạng thái; khóa/mở khóa tài khoản, đổi role |

## Thứ tự làm

1. API: toa tàu → tạo chuyến sinh ga dừng → danh sách admin (chuyến, đơn) → stats → xóa an toàn (kèm test).
2. Web: khung + guard + component dùng chung.
3. Trang Ga, Tàu, Tuyến, Giá (dữ liệu nền).
4. Trang Chuyến (phụ thuộc 3).
5. Trang Đơn, Người dùng, Tổng quan.
6. Kiểm tra end-to-end: admin tạo ga → tuyến → giá → tàu + toa → chuyến; khách tìm và đặt được vé.

## Quyết định của người làm (ghi rõ để duyệt)

- Chỉ ADMIN vào `/admin`; STAFF để sau.
- Loại toa giới hạn 3 loại có sẵn (SOFT/K4/K6) để tái dùng sơ đồ ghế của trang chọn chỗ.
- `arrivalTime` của chuyến tính tự động từ tuyến thay vì nhập tay (tránh lệch với ga dừng).
- Bảng giá dùng một mức giá đang hiệu lực mỗi tuyến × loại ghế (không quản lý lịch sử giá).
- Không thêm dependency mới.
