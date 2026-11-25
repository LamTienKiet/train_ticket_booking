# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khu vực `/admin` cho ADMIN quản lý ga, tàu (toa), tuyến (ga dừng), giá, chuyến, đơn, người dùng và xem số liệu — chuyến tạo từ admin phải đặt vé được thật.

**Architecture:** API NestJS bổ sung vài endpoint (`@Roles(Role.ADMIN)`) và sửa `TripService.create` để sinh `tripStations`. Web Next.js thêm route group `app/admin/` với layout kiểm tra role, bộ component dùng chung (bảng, form modal, xác nhận) viết bằng CSS Modules; mỗi trang quản lý chỉ khai báo cột + field.

**Tech Stack:** NestJS 11, Prisma (MySQL), Jest; Next.js 16 (App Router, client components), axios (`app/utils/axiosClient.ts`), CSS Modules.

**Spec:** `docs/superpowers/specs/2026-11-25-admin-dashboard-design.md`

## Global Constraints

- Không thêm dependency mới (API lẫn web).
- Mọi endpoint mới/sửa của admin dùng `@Roles(Role.ADMIN)` (`mod/auth/decorators/roles.decorator.ts`).
- Thông báo lỗi trả về và chữ trên UI bằng tiếng Việt.
- Không xóa cứng bản ghi đang được tham chiếu bởi đơn/chuyến: đổi trạng thái hoặc trả `409 ConflictException`.
- Loại toa chỉ `SOFT | K4 | K6`, sơ đồ ghế đúng như `prisma/seed.ts` hiện tại.
- `arrivalTime` của chuyến luôn tính từ tuyến, không nhận từ client.
- Web: giờ hiển thị theo `Asia/Ho_Chi_Minh` qua `app/utils/format.ts`; lỗi API hiển thị qua `apiErrorMessage` (`app/utils/apiError.ts`).
- Web dùng token màu như trang khách: `--primary #1d4ed8`, `--accent #ea580c`, `--line #e2e8f0`, `--muted #64748b`.
- Next.js trong repo này có thay đổi so với bản quen thuộc: đọc `apps/web/node_modules/next/dist/docs/` trước khi dùng API mới của Next (layout, routing).
- Lệnh test API: chạy trong `apps/api`, `npx jest <file>`; kiểm tra web: trong `apps/web`, `npx tsc --noEmit -p .` và `npx eslint app/admin`.

## Review Focus

1. Tạo chuyến cho tuyến chưa có ga dừng hoặc tàu chưa có toa → 400 với thông báo rõ, không tạo chuyến "chết". (Task 3)
2. Đổi giờ đi của chuyến đã có đơn PENDING/CONFIRMED → 409, không âm thầm dời giờ của vé đã bán. (Task 3)
3. Xóa toa có ghế nằm trong đơn → 409; toa chưa dùng → xóa và đánh lại `capacity`. (Task 2)
4. Route tĩnh `/trips/admin`, `/bookings/admin` phải khai báo **trước** route `:id`/`:bookingCode`, nếu không bị nuốt thành tham số. (Task 4, 5 — test controller gọi đúng handler)
5. Hết phiên / tài khoản không phải ADMIN mở `/admin` → chuyển `/login?next=/admin`; API trả 401/403 giữa chừng → trang hiện thông báo, không trắng màn hình. (Task 8)

---

## File Structure

**API (`apps/api`)**
- `src/mod/train/coach-layout.ts` — sơ đồ ghế theo loại toa (dùng chung seed + service).
- `src/mod/train/dto/add-coach.dto.ts` — `{ kind }`.
- `src/mod/train/train.service.ts`, `train.controller.ts` — thêm/xóa toa.
- `src/mod/trip/trip-schedule.ts` — tính giờ ga dừng từ offset.
- `src/mod/trip/trip.service.ts`, `trip.controller.ts`, `dto/create-trip.dto.ts`, `dto/query-admin-trip.dto.ts`.
- `src/mod/booking/booking.service.ts`, `booking.controller.ts`, `dto/query-admin-booking.dto.ts`.
- `src/mod/admin/admin.module.ts`, `admin.controller.ts`, `admin.service.ts`, `stats.ts` — số liệu.
- `src/mod/{station,train,route}/*.service.ts` — xóa an toàn.
- `prisma/seed.ts` — dùng `coach-layout.ts`.

**Web (`apps/web/app/admin`)**
- `layout.tsx` (guard + sidebar), `admin.module.css`
- `_components/`: `DataTable.tsx`, `FormModal.tsx`, `ConfirmDialog.tsx`, `StatusBadge.tsx`, `StatCard.tsx`, `BarChart.tsx`, `useAdminList.ts`
- `page.tsx` (tổng quan), `bookings/page.tsx`, `trips/page.tsx`, `stations/page.tsx`, `trains/page.tsx`, `trains/[id]/page.tsx`, `routes/page.tsx`, `routes/[id]/page.tsx`, `fares/page.tsx`, `users/page.tsx`
- `app/components/Navbar.tsx` — link "Quản trị".

---

### Task 1: Sơ đồ ghế dùng chung

**Files:**
- Create: `apps/api/src/mod/train/coach-layout.ts`
- Modify: `apps/api/prisma/seed.ts` (thay `seatsOf` cục bộ)
- Test: `apps/api/src/mod/train/coach-layout.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type CoachKind = 'SOFT' | 'K4' | 'K6';
  export const COACH_KINDS: CoachKind[];
  export const SEAT_TYPE_CODE: Record<CoachKind, 'SOFT_SEAT' | 'SLEEPER_4' | 'SLEEPER_6'>;
  export function coachTypeOf(kind: CoachKind): CoachType; // SOFT→SEATING, còn lại SLEEPER
  export function seatLayout(kind: CoachKind): { seatNumber: string; floorNumber: number; position: string }[];
  ```

- [ ] **Step 1: Test** `seatLayout`: SOFT → 10 ghế `A1..A5` (WINDOW) + `B1..B5` (AISLE); K4 → 8 ghế, ghế đầu `T1-01` LOWER floor 1, ghế cuối `T2-08` UPPER; K6 → 12 ghế, `C1-01`..`C2-06`, `C1-03` floor 2. `coachTypeOf('SOFT') === CoachType.SEATING`, `coachTypeOf('K6') === CoachType.SLEEPER`.
- [ ] **Step 2:** `npx jest src/mod/train/coach-layout.spec.ts` → FAIL (module not found).
- [ ] **Step 3:** Chuyển logic `seatsOf` từ `prisma/seed.ts` sang `seatLayout` (bỏ `seatTypeId`, seed map `SEAT_TYPE_CODE[kind]` → id loại ghế đã tạo). Seed import qua đường dẫn tương đối `../src/mod/train/coach-layout`.
- [ ] **Step 4:** Test PASS; `npx tsc --noEmit -p .` sạch; `npx prisma db seed` chạy lại không lỗi (seed dùng upsert nên an toàn với DB đang có).
- [ ] **Step 5:** Commit `feat(api): shared coach seat layout`.

### Task 2: Thêm / xóa toa

**Files:**
- Create: `apps/api/src/mod/train/dto/add-coach.dto.ts`
- Modify: `apps/api/src/mod/train/train.service.ts`, `train.controller.ts`
- Test: `apps/api/src/mod/train/train-coach.spec.ts`

**Interfaces:**
- Consumes: Task 1 `seatLayout`, `coachTypeOf`, `SEAT_TYPE_CODE`.
- Produces:
  - `POST /trains/:id/coaches` body `{ kind: CoachKind }` (`@IsIn(COACH_KINDS)`) → toa vừa tạo kèm `seats`.
  - `DELETE /trains/:id/coaches/:coachId` → `{ deleted: true }`.
  - `TrainService.addCoach(trainId: string, kind: CoachKind)`, `TrainService.removeCoach(trainId: string, coachId: string)`.

- [ ] **Step 1: Tests** (mock prisma kiểu `booking-expiry.spec.ts`, `$transaction(fn)` gọi `fn(tx)`):
  - `addCoach` tàu đã có toa số 1,2 → tạo toa `coachNumber: 3`, `capacity: 8` cho K4, `seat.createMany` 8 bản ghi với `seatTypeId` của `SLEEPER_4`.
  - `addCoach` tàu không tồn tại → `NotFoundException`.
  - `removeCoach` khi `bookingSeat.count > 0` → `ConflictException` ("Toa đã có ghế được đặt, không thể xóa"); `count === 0` → gọi `coach.delete`.
  - `removeCoach` coachId không thuộc trainId → `NotFoundException`.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Implement trong transaction; `coachNumber = max + 1`; thiếu loại ghế trong DB → `BadRequestException`. Hai route dưới `@Roles(Role.ADMIN)`.
- [ ] **Step 4:** PASS; chạy cả `npx jest src/mod/train`.
- [ ] **Step 5:** Commit `feat(api): add and remove train coaches`.

### Task 3: Tạo chuyến sinh ga dừng

**Files:**
- Create: `apps/api/src/mod/trip/trip-schedule.ts`
- Modify: `apps/api/src/mod/trip/trip.service.ts` (`create`, `update`), `dto/create-trip.dto.ts` (bỏ `arrivalTime`)
- Test: `apps/api/src/mod/trip/trip-schedule.spec.ts`, `apps/api/src/mod/trip/trip-create.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export function buildTripStations(
    departure: Date,
    stops: { stationId: string; stopOrder: number; arrivalOffsetMinutes: number; departureOffsetMinutes: number }[],
  ): { stops: { stationId: string; stopOrder: number; arrivalTime: Date | null; departureTime: Date | null }[]; arrivalTime: Date };
  ```
  Ga đầu: `arrivalTime null`; ga cuối: `departureTime null`; `arrivalTime` của chuyến = giờ đến ga cuối.
- `TripService.create(dto)` trả chuyến kèm `tripStations`. `UpdateTripDto` không còn `arrivalTime`.

- [ ] **Step 1: Tests**
  - `buildTripStations(new Date('2026-12-01T00:00:00Z'), [HAN 0/0, HUE 600/610, SGN 1800/1800])` → HUE arrival `10:00Z`, departure `10:10Z`; chuyến arrival `2026-12-02T06:00:00Z`; stops sắp theo `stopOrder` dù input lộn xộn.
  - `create`: tuyến có 0 `routeStation` → `BadRequestException` "Tuyến chưa có ga dừng"; tàu 0 toa → `BadRequestException` "Tàu chưa có toa"; hợp lệ → `trip.create` có `tripStations.create` 3 phần tử và `arrivalTime` tính được.
  - `update` đổi `departureTime` khi `booking.count({ status in [PENDING, CONFIRMED] }) > 0` → `ConflictException`; khi 0 → cập nhật trip và từng `tripStation` theo giờ mới.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement. `update` chỉ đổi `status`/`tripCode` thì không đụng `tripStations`. Đổi `routeId`/`trainId` khi đã có đơn → `ConflictException`.
- [ ] **Step 4:** PASS + `npx jest src/mod/trip`.
- [ ] **Step 5:** Commit `feat(api): trips generate stops from route schedule`.

### Task 4: Danh sách chuyến cho admin

**Files:**
- Create: `apps/api/src/mod/trip/dto/query-admin-trip.dto.ts`
- Modify: `trip.service.ts`, `trip.controller.ts`
- Test: `apps/api/src/mod/trip/trip-admin-list.spec.ts`

**Interfaces:**
- Produces: `GET /trips/admin?status=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20` →
  ```ts
  { items: { id; tripCode; status; departureTime; arrivalTime;
             route: { id; code; name }; train: { id; code };
             soldSeats: number; totalSeats: number }[];
    total: number; page: number; limit: number }
  ```
  `soldSeats` = số `bookingSeat` status HELD|CONFIRMED (đếm ghế, không phân chặng). Sắp theo `departureTime desc`. `limit` tối đa 100.

- [ ] **Step 1: Tests** — lọc `status` đưa vào `where`; `from`/`to` thành khoảng `departureTime` (giờ VN: `from` 00:00 +07:00, `to` 23:59:59 +07:00); `totalSeats` = tổng `capacity` toa của tàu. Test controller: `Reflect.getMetadata('path', TripController.prototype.findAllAdmin) === 'admin'` và method này được khai báo trước `findOne` (`Object.getOwnPropertyNames(TripController.prototype).indexOf('findAllAdmin') < indexOf('findOne')`).
- [ ] **Step 2:** FAIL. **Step 3:** Implement (2 query: trips + `bookingSeat.groupBy({ by: ['bookingId'] })` hoặc `_count`; chọn cách gọn nhất). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(api): admin trip list`.

### Task 5: Danh sách đơn cho admin

**Files:**
- Create: `apps/api/src/mod/booking/dto/query-admin-booking.dto.ts`
- Modify: `booking.service.ts`, `booking.controller.ts`
- Test: `apps/api/src/mod/booking/booking-admin-list.spec.ts`

**Interfaces:**
- Produces: `GET /bookings/admin?status=&search=&page=&limit=` →
  `{ items: { bookingCode; status; contactName; contactPhone; contactEmail; totalAmount: number; seatCount: number; createdAt; trip: { tripCode; departureTime; route: { name } } }[]; total; page; limit }`.
  Chi tiết đơn dùng `GET /bookings/:bookingCode` có sẵn; hủy dùng `POST /bookings/:bookingCode/cancel` có sẵn.

- [ ] **Step 1: Tests** — `search` tạo `OR` trên `bookingCode`, `contactPhone`, `contactEmail` (contains); `totalAmount` trả về kiểu `number`; khai báo `findAllAdmin` trước handler `:bookingCode` (cùng cách kiểm tra Task 4).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(api): admin booking list`.

### Task 6: Số liệu tổng quan

**Files:**
- Create: `apps/api/src/mod/admin/{admin.module.ts,admin.controller.ts,admin.service.ts,stats.ts}`
- Modify: `apps/api/src/app.module.ts` (import `AdminModule`)
- Test: `apps/api/src/mod/admin/stats.spec.ts`

**Interfaces:**
- Produces: `GET /admin/stats?days=30` (days 7..90, mặc định 30) →
  ```ts
  { revenue: number; ticketsSold: number; pendingBookings: number; tripsToday: number;
    bookingsByStatus: Record<BookingStatus, number>;
    dailyRevenue: { date: string /* YYYY-MM-DD giờ VN */; amount: number }[]; // đủ `days` phần tử, ngày không có = 0
    topRoutes: { routeName: string; revenue: number; tickets: number }[];   // tối đa 5
    upcomingTrips: { id; tripCode; departureTime; routeName; soldSeats; totalSeats }[] } // 24h tới, tối đa 5
  ```
  `revenue`/`dailyRevenue` tính từ `payment` status SUCCESS theo `paidAt`. `ticketsSold` = `bookingSeat` CONFIRMED trong khoảng.
- `stats.ts`: `export function bucketDaily(rows: { at: Date; amount: number }[], days: number, now: Date): { date: string; amount: number }[]`.

- [ ] **Step 1: Tests** cho `bucketDaily`: 3 payment cùng ngày VN cộng dồn; payment `2026-11-24T18:30:00Z` thuộc ngày `2026-11-25` (giờ VN); kết quả đúng `days` phần tử, tăng dần, ngày trống `amount: 0`.
- [ ] **Step 2–4:** FAIL → implement (service gọi prisma, đẩy phần tính toán vào `stats.ts`) → PASS.
- [ ] **Step 5:** Commit `feat(api): admin dashboard stats`.

### Task 7: Xóa an toàn

**Files:**
- Modify: `apps/api/src/mod/station/station.service.ts`, `train/train.service.ts`, `route/route.service.ts`, `trip/trip.service.ts` (`remove`)
- Test: `apps/api/src/mod/admin/safe-delete.spec.ts`

**Interfaces:**
- Produces (hành vi `DELETE`):
  - Ga: có `routeStation`/`tripStation` → đổi `status: INACTIVE`, trả `{ deactivated: true }`; không → xóa, `{ deleted: true }`.
  - Tàu: có `trip` → `status: INACTIVE`, `{ deactivated: true }`; không → xóa.
  - Tuyến: có `trip` → `status: INACTIVE`; không → xóa (`routeStations` cascade, `fareRules` xóa trước).
  - Chuyến: có `booking` → `status: CANCELLED`, `{ cancelled: true }`; không → xóa (`tripStations` xóa trước).

- [ ] **Step 1: Tests** — mỗi loại 2 case (có tham chiếu / không), kiểm tra gọi `update` hay `delete` và giá trị trả về.
- [ ] **Step 2–4:** FAIL → implement → PASS; chạy toàn bộ `npx jest` (36 test cũ vẫn xanh).
- [ ] **Step 5:** Commit `feat(api): safe delete for referenced records`.

### Task 8: Khung admin web + component dùng chung

**Files:**
- Create: `apps/web/app/admin/layout.tsx`, `admin.module.css`, `_components/{DataTable,FormModal,ConfirmDialog,StatusBadge,StatCard,BarChart}.tsx`, `_components/useAdminList.ts`
- Modify: `apps/web/app/components/Navbar.tsx`, `apps/web/app/login/*` (đọc `next` sau khi đăng nhập)

**Interfaces:**
- Produces:
  ```ts
  type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode; width?: string };
  <DataTable<T> columns rows={T[]} loading error total page limit onPageChange
     toolbar?={ReactNode} onRowClick?={(row: T) => void} rowKey={(row: T) => string} emptyText? />
  type Field = { name: string; label: string; type: 'text'|'number'|'select'|'datetime'|'textarea';
                 options?: { value: string; label: string }[]; required?: boolean; hint?: string };
  <FormModal title fields={Field[]} initial={Record<string, unknown>} open onClose
     onSubmit={(values) => Promise<void>} submitLabel? />   // bắt lỗi onSubmit → hiện apiErrorMessage trong modal
  <ConfirmDialog open title message confirmLabel danger? onConfirm={() => Promise<void>} onClose />
  <StatusBadge value={string} />   // map ACTIVE/CONFIRMED/SCHEDULED=xanh, PENDING/BOARDING=vàng, CANCELLED/EXPIRED/INACTIVE/BANNED=đỏ/xám
  <StatCard label value hint? />
  <BarChart data={{ label: string; value: number }[]} formatValue={(n) => string} />  // SVG, có <title> mỗi cột
  useAdminList<T>(url: string, params: Record<string, string|number|undefined>)
    => { rows: T[]; total: number; loading: boolean; error: string; reload: () => void }
    // chấp nhận response dạng mảng hoặc { items, total }
  ```
- Layout: `authService.getCurrentUser()?.role !== 'ADMIN'` → `router.replace('/login?next=/admin')`; sidebar mục: Tổng quan, Đơn đặt vé, Chuyến tàu, Ga, Tàu, Tuyến, Bảng giá, Người dùng, "← Về trang khách". Mobile (<860px): sidebar thành thanh cuộn ngang trên cùng.
- Navbar: ADMIN thấy link "Quản trị" → `/admin`.

- [ ] **Step 1:** Implement khung + component. `FormModal` có `role="dialog"`, `aria-modal`, Esc đóng, focus ô đầu tiên; `datetime` dùng `<input type="datetime-local">`, gửi lên API bằng `new Date(value).toISOString()`.
- [ ] **Step 2:** `npx tsc --noEmit -p .` và `npx eslint app/admin` sạch.
- [ ] **Step 3: Kiểm tra tay** (API + web đang chạy): đăng nhập `customer` mở `/admin` → bị chuyển về `/login?next=/admin`; đăng nhập `admin` → về `/admin`, thấy sidebar; xóa `accessToken` trong storage rồi bấm trang bất kỳ → trang hiện lỗi từ API, không trắng.
- [ ] **Step 4:** Commit `feat(web): admin shell and shared components`.

### Task 9: Trang Ga

**Files:** Create `apps/web/app/admin/stations/page.tsx`
**Interfaces:** Consumes Task 8; API `GET /stations?search=&status=`, `POST/PATCH/DELETE /stations/:id`; Task 7 kết quả `deactivated`.

- [ ] **Step 1:** Bảng cột Mã, Tên ga, Thành phố, Địa chỉ, Trạng thái, thao tác (Sửa, Xóa). Tìm kiếm; lọc trạng thái (Tất cả/ACTIVE/INACTIVE — gửi `status`, lưu ý API mặc định chỉ trả ACTIVE). Form: code, name, city, address, status. Xóa → nếu `deactivated` báo "Ga đang được dùng nên đã chuyển sang ngừng hoạt động".
- [ ] **Step 2:** tsc + eslint sạch. **Step 3:** Tay: thêm ga "Ga Test" → thấy trong bảng và trong ô chọn ga trang chủ; sửa; xóa.
- [ ] **Step 4:** Commit `feat(web): admin stations`.

### Task 10: Trang Tàu + toa

**Files:** Create `apps/web/app/admin/trains/page.tsx`, `trains/[id]/page.tsx`
**Interfaces:** Consumes Task 2 (`POST /trains/:id/coaches`, `DELETE /trains/:id/coaches/:coachId`), `GET /trains`, `GET /trains/:id`, CRUD `/trains`.

- [ ] **Step 1:** Danh sách: Mã, Tên, Số toa, Tổng chỗ, Trạng thái; bấm dòng → chi tiết. Chi tiết: thông tin tàu (sửa được), bảng toa (Số toa, Loại, Số chỗ, Xóa), nút "Thêm toa" chọn 3 loại (Ghế mềm 10 chỗ / Giường khoang 4 — 8 / Giường khoang 6 — 12). Banner cảnh báo khi tàu chưa có toa: "Tàu chưa có toa nên chưa tạo chuyến được".
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: tạo tàu `TEST1`, thêm 2 toa, xóa 1 toa.
- [ ] **Step 4:** Commit `feat(web): admin trains and coaches`.

### Task 11: Trang Tuyến + ga dừng

**Files:** Create `apps/web/app/admin/routes/page.tsx`, `routes/[id]/page.tsx`
**Interfaces:** API có sẵn `GET/POST/PATCH/DELETE /routes`, `POST /routes/:id/stations`, `DELETE /routes/:id/stations/:stationId` (đọc DTO `route/dto/route-station.dto.ts` để lấy đúng tên field).

- [ ] **Step 1:** Danh sách: Mã, Tên, Ga đầu → Ga cuối, Km, Số ga dừng, Trạng thái. Form tuyến: code, name, ga đầu, ga cuối (select từ `/stations`), km. Chi tiết: bảng ga dừng theo thứ tự (Thứ tự, Ga, Đến sau (phút), Đi sau (phút), Km từ ga đầu, Xóa) + form thêm ga dừng. Hiện thời gian dạng "10h 10m" cạnh số phút.
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: tạo tuyến TEST giữa 2 ga có sẵn, thêm 2 ga dừng (0/0/0km và 300/300/250km).
- [ ] **Step 4:** Commit `feat(web): admin routes and stops`.

### Task 12: Trang Bảng giá

**Files:** Create `apps/web/app/admin/fares/page.tsx`
**Interfaces:** API có sẵn `/fares` (CRUD) và `POST /fares/:id/passenger-fares`, `DELETE /fares/:id/passenger-fares/:passengerType` (đọc `fare/dto/*.ts` cho field). Loại ghế lấy từ dữ liệu fare trả về hoặc mã cố định `SOFT_SEAT | SLEEPER_4 | SLEEPER_6` nếu API không có endpoint loại ghế.

- [ ] **Step 1:** Lọc theo tuyến; bảng: Tuyến, Loại ghế, Giá gốc, Giảm Trẻ em/Sinh viên/Cao tuổi (%), Hiệu lực từ, Sửa/Xóa. Form thêm/sửa giá gốc + 3 ô % giảm (lưu bằng passenger-fares).
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: thêm giá 3 loại ghế cho tuyến TEST.
- [ ] **Step 4:** Commit `feat(web): admin fares`.

### Task 13: Trang Chuyến

**Files:** Create `apps/web/app/admin/trips/page.tsx`
**Interfaces:** Consumes Task 3 (`POST /trips` không gửi `arrivalTime`), Task 4 (`GET /trips/admin`), Task 7.

- [ ] **Step 1:** Bảng: Mã chuyến, Tuyến, Tàu, Giờ đi, Giờ đến, Đã bán/Tổng chỗ (thanh tiến độ nhỏ), Trạng thái, thao tác (Đổi trạng thái, Xem như khách → `/trips/seats?tripId=…`, Xóa/Hủy). Lọc trạng thái + khoảng ngày. Form thêm: tripCode, tuyến, tàu, giờ đi; hiện xem trước giờ đến = giờ đi + `estimatedDurationMins` (hoặc offset ga cuối từ `GET /routes/:id`).
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: tạo chuyến TEST (tuyến + tàu ở Task 10–11) → khách tìm thấy ở trang chủ/tìm kiếm và vào sơ đồ ghế được; thử tạo chuyến với tàu chưa có toa → thông báo lỗi trong form.
- [ ] **Step 4:** Commit `feat(web): admin trips`.

### Task 14: Trang Đơn đặt vé

**Files:** Create `apps/web/app/admin/bookings/page.tsx`
**Interfaces:** Consumes Task 5; `GET /bookings/:bookingCode`, `POST /bookings/:bookingCode/cancel`.

- [ ] **Step 1:** Bảng: Mã đơn, Khách (tên + SĐT), Chuyến, Số vé, Tổng tiền, Trạng thái, Ngày đặt. Tab trạng thái + ô tìm. Bấm dòng → panel bên phải: hành khách, ghế, thanh toán; nút "Hủy đơn" (ConfirmDialog, ẩn khi CANCELLED/EXPIRED).
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: đặt 1 vé bằng tài khoản khách → thấy trong admin → hủy → trạng thái CANCELLED và ghế trống lại trên sơ đồ.
- [ ] **Step 4:** Commit `feat(web): admin bookings`.

### Task 15: Trang Người dùng

**Files:** Create `apps/web/app/admin/users/page.tsx`
**Interfaces:** API có sẵn `GET /users?role=&status=&page=&limit=`, `PATCH /users/:id` (đọc `user/dto/update-user.dto.ts` cho field role/status).

- [ ] **Step 1:** Bảng: Họ tên, Tài khoản, Email, SĐT, Role, Trạng thái, Ngày tạo; lọc role/status, tìm. Thao tác: Khóa/Mở khóa (BANNED ↔ ACTIVE), đổi role (select). Không cho tự khóa/hạ quyền chính mình (so `id` với user hiện tại, ẩn nút).
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: khóa `customer3` → đăng nhập bằng tài khoản đó bị từ chối.
- [ ] **Step 4:** Commit `feat(web): admin users`.

### Task 16: Trang Tổng quan

**Files:** Create `apps/web/app/admin/page.tsx`
**Interfaces:** Consumes Task 6 `GET /admin/stats`, Task 8 `StatCard`, `BarChart`.

- [ ] **Step 1:** 4 `StatCard` (Doanh thu, Vé đã bán, Đơn chờ thanh toán, Chuyến hôm nay), chọn khoảng 7/30/90 ngày, `BarChart` doanh thu theo ngày (nhãn `dd/MM`), bảng Top tuyến, danh sách chuyến 24h tới (link sang `/admin/trips`), donut/thanh tỉ lệ đơn theo trạng thái (dùng thanh ngang CSS).
- [ ] **Step 2:** tsc + eslint. **Step 3:** Tay: số doanh thu khớp tổng các đơn CONFIRMED vừa đặt ở Task 14.
- [ ] **Step 4:** Commit `feat(web): admin dashboard overview`.

### Task 17: Kiểm tra trọn luồng + ghi chú

**Files:** Modify `README.md` (thêm mục "Trang quản trị": đường dẫn, tài khoản `admin@train.com`, luồng tạo chuyến)

- [ ] **Step 1:** `npx jest` (API) xanh toàn bộ; `npx tsc --noEmit -p .` (web) sạch.
- [ ] **Step 2:** Tay, từ DB seed sạch: admin tạo ga → tuyến + ga dừng → giá → tàu + toa → chuyến; đăng xuất; khách tìm đúng chặng, chọn ghế, đặt, thanh toán; admin thấy đơn và doanh thu tăng.
- [ ] **Step 3:** Commit `docs: admin section in README`.
