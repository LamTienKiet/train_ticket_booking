import {
  PrismaClient,
  Role,
  CoachType,
  TripStatus,
  PassengerType,
  BookingStatus,
  BookingSeatStatus,
  PaymentStatus,
  PaymentProvider,
  TicketStatus,
  Station,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Số ngày có lịch chạy tính từ hôm nay. Chạy lại seed => thêm ngày mới, chuyến cũ giữ nguyên.
const SCHEDULE_DAYS = 7;

// ─────────────────────────────────────────────
// Ngày giờ theo giờ Việt Nam (không phụ thuộc múi giờ máy chạy seed)
// ─────────────────────────────────────────────
const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const addDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const vnTime = (ymd: string, hhmm: string) => new Date(`${ymd}T${hhmm}:00+07:00`);
const ymdOf = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
const minutesAfter = (d: Date, mins: number) => new Date(d.getTime() + mins * 60_000);

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu...\n');

  // ─────────────────────────────────────────────
  // 1. ACCOUNTS & USERS
  // ─────────────────────────────────────────────
  console.log('👤 Tạo tài khoản...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const accounts = [
    { email: 'admin@train.com', username: 'admin', role: Role.ADMIN, fullName: 'Quản trị viên', phone: '0900000001' },
    { email: 'staff@train.com', username: 'staff', role: Role.STAFF, fullName: 'Nhân viên nhà ga', phone: '0900000002' },
    { email: 'customer@train.com', username: 'customer', role: Role.CUSTOMER, fullName: 'Nguyễn Văn A', phone: '0912345678' },
    { email: 'customer2@train.com', username: 'customer2', role: Role.CUSTOMER, fullName: 'Trần Thị B', phone: '0987654321' },
    { email: 'customer3@train.com', username: 'customer3', role: Role.CUSTOMER, fullName: 'Lê Văn C', phone: '0934567890' },
  ];
  const userByEmail = new Map<string, { id: string; fullName: string; phone: string }>();
  for (const a of accounts) {
    const account = await prisma.account.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        username: a.username,
        passwordHash,
        role: a.role,
        user: { create: { fullName: a.fullName, phone: a.phone } },
      },
      include: { user: true },
    });
    if (account.user) {
      userByEmail.set(a.email, { id: account.user.id, fullName: a.fullName, phone: a.phone });
    }
  }
  console.log(`   ✅ ${accounts.length} tài khoản (admin, staff, 3 khách hàng)`);

  // ─────────────────────────────────────────────
  // 2. STATIONS (Nhà ga)
  // ─────────────────────────────────────────────
  console.log('\n🏛️  Tạo nhà ga...');

  const stationDefs = [
    { code: 'HAN', name: 'Ga Hà Nội', city: 'Hà Nội', address: '120 Lê Duẩn, Hoàn Kiếm, Hà Nội', latitude: 21.0245, longitude: 105.8412 },
    { code: 'THA', name: 'Ga Thanh Hóa', city: 'Thanh Hóa', address: '19 Dương Đình Nghệ, TP. Thanh Hóa', latitude: 19.8075, longitude: 105.7766 },
    { code: 'VIN', name: 'Ga Vinh', city: 'Nghệ An', address: 'Phường Lê Mao, TP. Vinh, Nghệ An', latitude: 18.6718, longitude: 105.6932 },
    { code: 'DOH', name: 'Ga Đồng Hới', city: 'Quảng Bình', address: 'Tiểu khu 4, Nam Lý, TP. Đồng Hới', latitude: 17.4659, longitude: 106.604 },
    { code: 'HUE', name: 'Ga Huế', city: 'Thừa Thiên Huế', address: '2 Bùi Thị Xuân, TP. Huế', latitude: 16.4637, longitude: 107.5909 },
    { code: 'DAD', name: 'Ga Đà Nẵng', city: 'Đà Nẵng', address: '791 Hải Phòng, Thanh Khê, Đà Nẵng', latitude: 16.0748, longitude: 108.2069 },
    { code: 'NTR', name: 'Ga Nha Trang', city: 'Khánh Hòa', address: '17 Thái Nguyên, TP. Nha Trang', latitude: 12.2388, longitude: 109.1967 },
    { code: 'TCH', name: 'Ga Tháp Chàm', city: 'Ninh Thuận', address: 'Phường Đô Vinh, TP. Phan Rang - Tháp Chàm', latitude: 11.5806, longitude: 108.945 },
    { code: 'BTH', name: 'Ga Bình Thuận', city: 'Bình Thuận', address: 'Xã Mương Mán, Hàm Thuận Nam, Bình Thuận', latitude: 10.9877, longitude: 108.075 },
    { code: 'SGN', name: 'Ga Sài Gòn', city: 'TP. Hồ Chí Minh', address: '01 Nguyễn Thông, Quận 3, TP.HCM', latitude: 10.7812, longitude: 106.6827 },
    { code: 'YBA', name: 'Ga Yên Bái', city: 'Yên Bái', address: 'Đường Nguyễn Phúc, TP. Yên Bái', latitude: 21.7056, longitude: 104.8781 },
    { code: 'LCA', name: 'Ga Lào Cai', city: 'Lào Cai', address: 'Đường Phạm Văn Xảo, TP. Lào Cai', latitude: 22.4911, longitude: 103.9706 },
  ];
  const st: Record<string, Station> = {};
  for (const s of stationDefs) {
    st[s.code] = await prisma.station.upsert({ where: { code: s.code }, update: {}, create: s });
  }
  console.log(`   ✅ ${stationDefs.length} ga (trục Bắc - Nam + tuyến Lào Cai)`);

  // ─────────────────────────────────────────────
  // 3. SEAT TYPES (Loại ghế)
  // ─────────────────────────────────────────────
  console.log('\n🪑 Tạo loại ghế...');

  const softSeat = await prisma.seatType.upsert({
    where: { code: 'SOFT_SEAT' },
    update: {},
    create: { code: 'SOFT_SEAT', name: 'Ghế Mềm Điều Hòa', priceMultiplier: 1.0 },
  });
  const sleeper4 = await prisma.seatType.upsert({
    where: { code: 'SLEEPER_4' },
    update: {},
    create: { code: 'SLEEPER_4', name: 'Giường Nằm Khoang 4', priceMultiplier: 1.5 },
  });
  const sleeper6 = await prisma.seatType.upsert({
    where: { code: 'SLEEPER_6' },
    update: {},
    create: { code: 'SLEEPER_6', name: 'Giường Nằm Khoang 6', priceMultiplier: 1.2 },
  });
  console.log(`   ✅ 3 loại: Ghế Mềm, Giường 4, Giường 6`);

  // ─────────────────────────────────────────────
  // 4. TRAINS + COACHES + SEATS
  // ─────────────────────────────────────────────
  console.log('\n🚂 Tạo tàu hỏa...');

  // SOFT: toa ghế mềm 10 chỗ | K4: toa giường khoang 4 (8 giường) | K6: toa giường khoang 6 (12 giường)
  type CoachKind = 'SOFT' | 'K4' | 'K6';
  const seatsOf = (kind: CoachKind) => {
    if (kind === 'SOFT') {
      return [
        ...['A1', 'A2', 'A3', 'A4', 'A5'].map((n) => ({ seatNumber: n, floorNumber: 1, position: 'WINDOW', seatTypeId: softSeat.id })),
        ...['B1', 'B2', 'B3', 'B4', 'B5'].map((n) => ({ seatNumber: n, floorNumber: 1, position: 'AISLE', seatTypeId: softSeat.id })),
      ];
    }
    if (kind === 'K4') {
      return Array.from({ length: 8 }, (_, idx) => {
        const i = idx + 1;
        return {
          seatNumber: `T${Math.ceil(i / 4)}-0${i}`,
          floorNumber: i % 2 === 0 ? 2 : 1,
          position: i <= 4 ? 'LOWER' : 'UPPER',
          seatTypeId: sleeper4.id,
        };
      });
    }
    return Array.from({ length: 12 }, (_, idx) => {
      const i = idx + 1;
      const numInComp = ((i - 1) % 6) + 1;
      return {
        seatNumber: `C${Math.ceil(i / 6)}-${String(numInComp).padStart(2, '0')}`,
        floorNumber: numInComp <= 2 ? 1 : numInComp <= 4 ? 2 : 3,
        position: numInComp % 2 === 0 ? 'UPPER' : 'LOWER',
        seatTypeId: sleeper6.id,
      };
    });
  };

  const trainDefs: { code: string; name: string; coaches: CoachKind[] }[] = [
    { code: 'SE1', name: 'Tàu Thống Nhất SE1', coaches: ['SOFT', 'K4', 'K6'] },
    { code: 'SE2', name: 'Tàu Thống Nhất SE2', coaches: ['SOFT', 'K4', 'K6'] },
    { code: 'SE3', name: 'Tàu Thống Nhất SE3', coaches: ['SOFT', 'K4'] },
    { code: 'SE4', name: 'Tàu Thống Nhất SE4', coaches: ['SOFT', 'K4'] },
    { code: 'SE19', name: 'Tàu Hà Nội - Đà Nẵng SE19', coaches: ['SOFT', 'K4', 'K6'] },
    { code: 'SE20', name: 'Tàu Đà Nẵng - Hà Nội SE20', coaches: ['SOFT', 'K4', 'K6'] },
    { code: 'SNT1', name: 'Tàu Sài Gòn - Nha Trang SNT1', coaches: ['SOFT', 'K4'] },
    { code: 'SNT2', name: 'Tàu Nha Trang - Sài Gòn SNT2', coaches: ['SOFT', 'K4'] },
    { code: 'SP1', name: 'Tàu Hà Nội - Lào Cai SP1', coaches: ['SOFT', 'K4'] },
    { code: 'SP2', name: 'Tàu Lào Cai - Hà Nội SP2', coaches: ['SOFT', 'K4'] },
  ];

  const trainByCode: Record<string, { id: string }> = {};
  let seatTotal = 0;
  for (const t of trainDefs) {
    const train = await prisma.train.upsert({
      where: { code: t.code },
      update: {},
      create: { code: t.code, name: t.name },
    });
    trainByCode[t.code] = train;
    for (const [i, kind] of t.coaches.entries()) {
      const seats = seatsOf(kind);
      const coach = await prisma.coach.upsert({
        where: { trainId_coachNumber: { trainId: train.id, coachNumber: i + 1 } },
        update: {},
        create: {
          trainId: train.id,
          coachNumber: i + 1,
          coachType: kind === 'SOFT' ? CoachType.SEATING : CoachType.SLEEPER,
          capacity: seats.length,
        },
      });
      for (const s of seats) {
        await prisma.seat.upsert({
          where: { coachId_seatNumber: { coachId: coach.id, seatNumber: s.seatNumber } },
          update: {},
          create: { coachId: coach.id, ...s },
        });
      }
      seatTotal += seats.length;
    }
  }
  console.log(`   ✅ ${trainDefs.length} đoàn tàu, ${seatTotal} chỗ`);

  // ─────────────────────────────────────────────
  // 5. ROUTES (Tuyến đường) + ga dừng
  // ─────────────────────────────────────────────
  console.log('\n🛤️  Tạo tuyến đường...');

  // [mã ga, km từ ga đầu, phút đến (tính từ giờ xuất phát), phút đi]
  type StopDef = [string, number, number, number];
  const routeDefs: { code: string; name: string; stops: StopDef[]; fares: [number, number, number] }[] = [
    {
      code: 'HAN-SGN', name: 'Hà Nội - Sài Gòn', fares: [680_000, 960_000, 810_000],
      stops: [['HAN', 0, 0, 0], ['VIN', 319, 290, 295], ['HUE', 688, 540, 548], ['DAD', 791, 615, 625], ['NTR', 1315, 1060, 1068], ['SGN', 1726, 1860, 1860]],
    },
    {
      code: 'SGN-HAN', name: 'Sài Gòn - Hà Nội', fares: [680_000, 960_000, 810_000],
      stops: [['SGN', 0, 0, 0], ['NTR', 411, 380, 388], ['DAD', 935, 900, 910], ['HUE', 1038, 985, 993], ['VIN', 1407, 1220, 1228], ['HAN', 1726, 1920, 1920]],
    },
    {
      code: 'HAN-DAD', name: 'Hà Nội - Đà Nẵng', fares: [420_000, 620_000, 540_000],
      stops: [['HAN', 0, 0, 0], ['THA', 175, 175, 180], ['VIN', 319, 300, 305], ['DOH', 522, 520, 528], ['HUE', 688, 700, 708], ['DAD', 791, 790, 790]],
    },
    {
      code: 'DAD-HAN', name: 'Đà Nẵng - Hà Nội', fares: [420_000, 620_000, 540_000],
      stops: [['DAD', 0, 0, 0], ['HUE', 103, 85, 93], ['DOH', 269, 265, 273], ['VIN', 472, 480, 485], ['THA', 616, 610, 615], ['HAN', 791, 790, 790]],
    },
    {
      code: 'SGN-NTR', name: 'Sài Gòn - Nha Trang', fares: [230_000, 380_000, 330_000],
      stops: [['SGN', 0, 0, 0], ['BTH', 175, 225, 230], ['TCH', 319, 380, 385], ['NTR', 411, 480, 480]],
    },
    {
      code: 'NTR-SGN', name: 'Nha Trang - Sài Gòn', fares: [230_000, 380_000, 330_000],
      stops: [['NTR', 0, 0, 0], ['TCH', 92, 95, 100], ['BTH', 236, 255, 260], ['SGN', 411, 480, 480]],
    },
    {
      code: 'HAN-LCA', name: 'Hà Nội - Lào Cai', fares: [200_000, 390_000, 330_000],
      stops: [['HAN', 0, 0, 0], ['YBA', 155, 230, 235], ['LCA', 294, 480, 480]],
    },
    {
      code: 'LCA-HAN', name: 'Lào Cai - Hà Nội', fares: [200_000, 390_000, 330_000],
      stops: [['LCA', 0, 0, 0], ['YBA', 139, 245, 250], ['HAN', 294, 480, 480]],
    },
  ];

  // Giảm giá theo đối tượng: phải khớp với BookingService.create (nơi thực sự tính tiền)
  const passengerDiscounts = [
    { passengerType: PassengerType.ADULT, discountPercent: 0 },
    { passengerType: PassengerType.CHILD, discountPercent: 25 },
    { passengerType: PassengerType.STUDENT, discountPercent: 10 },
    { passengerType: PassengerType.SENIOR, discountPercent: 15 },
    { passengerType: PassengerType.INFANT, discountPercent: 100 },
  ];
  const effectiveFrom = new Date('2026-01-01T00:00:00Z');

  const routeByCode: Record<string, { id: string; stops: StopDef[] }> = {};
  for (const r of routeDefs) {
    const first = r.stops[0];
    const last = r.stops[r.stops.length - 1];
    const route = await prisma.route.upsert({
      where: { code: r.code },
      update: {},
      create: {
        code: r.code,
        name: r.name,
        originStationId: st[first[0]].id,
        destinationStationId: st[last[0]].id,
        distanceKm: last[1],
        estimatedDurationMins: last[2],
      },
    });
    routeByCode[r.code] = { id: route.id, stops: r.stops };

    for (const [i, [code, km, arr, dep]] of r.stops.entries()) {
      const data = { arrivalOffsetMinutes: arr, departureOffsetMinutes: dep, distanceFromOriginKm: km };
      await prisma.routeStation.upsert({
        where: { routeId_stationId: { routeId: route.id, stationId: st[code].id } },
        update: data,
        create: { routeId: route.id, stationId: st[code].id, stopOrder: i + 1, ...data },
      });
    }

    // Bảng giá (giá cả tuyến; giá chặng tính theo km khi đặt)
    for (const [seatTypeId, basePrice] of [
      [softSeat.id, r.fares[0]],
      [sleeper4.id, r.fares[1]],
      [sleeper6.id, r.fares[2]],
    ] as const) {
      const fareRule =
        (await prisma.fareRule.findFirst({ where: { routeId: route.id, seatTypeId } })) ??
        (await prisma.fareRule.create({
          data: { routeId: route.id, seatTypeId, basePrice, effectiveFrom },
        }));
      for (const pf of passengerDiscounts) {
        await prisma.passengerFareRule.upsert({
          where: { fareRuleId_passengerType: { fareRuleId: fareRule.id, passengerType: pf.passengerType } },
          update: { discountPercent: pf.discountPercent },
          create: { fareRuleId: fareRule.id, ...pf },
        });
      }
    }
  }
  console.log(`   ✅ ${routeDefs.length} tuyến (4 cặp đi/về) kèm km từng ga và bảng giá`);

  // ─────────────────────────────────────────────
  // 6. TRIPS — lịch chạy hằng ngày
  // ─────────────────────────────────────────────
  console.log('\n🗓️  Tạo các chuyến tàu...');

  const schedules = [
    { train: 'SE1', route: 'HAN-SGN', depart: '06:00' },
    { train: 'SE3', route: 'HAN-SGN', depart: '19:00' },
    { train: 'SE2', route: 'SGN-HAN', depart: '08:00' },
    { train: 'SE4', route: 'SGN-HAN', depart: '19:30' },
    { train: 'SE19', route: 'HAN-DAD', depart: '20:00' },
    { train: 'SE20', route: 'DAD-HAN', depart: '18:00' },
    { train: 'SNT1', route: 'SGN-NTR', depart: '21:00' },
    { train: 'SNT2', route: 'NTR-SGN', depart: '20:30' },
    { train: 'SP1', route: 'HAN-LCA', depart: '21:35' },
    { train: 'SP2', route: 'LCA-HAN', depart: '21:30' },
  ];

  // Seed cũ dùng mã cố định (SE1-20261101...) và cho chuyến SGN→HAN chạy bằng tàu SE1.
  // Đổi sang mã theo ngày để không bị trùng với lịch mới; đơn đã đặt trên các chuyến này giữ nguyên.
  for (const [legacyCode, trainCode] of [
    ['SE1-20261101', 'SE1'],
    ['SE1-20261102', 'SE1'],
    ['SE3-20261101', 'SE3'],
    ['SE2-20261101', 'SE2'],
  ]) {
    const legacy = await prisma.trip.findUnique({
      where: { tripCode: legacyCode },
      include: { _count: { select: { bookings: true } } },
    });
    if (!legacy) continue;
    const newCode = `${trainCode}-${ymdOf(legacy.departureTime).replace(/-/g, '')}`;
    if (await prisma.trip.findUnique({ where: { tripCode: newCode } })) continue;
    await prisma.trip.update({
      where: { id: legacy.id },
      data: {
        tripCode: newCode,
        // Đổi tàu khi chưa có đơn; có đơn thì ghế đã đặt thuộc tàu cũ nên giữ nguyên
        ...(legacy._count.bookings === 0 && { trainId: trainByCode[trainCode].id }),
      },
    });
  }

  const today = vnToday();
  const tripsByCode: Record<string, { id: string; trainId: string; routeId: string }> = {};
  let tripCount = 0;
  for (let day = 0; day < SCHEDULE_DAYS; day++) {
    const ymd = addDays(today, day);
    for (const s of schedules) {
      const route = routeByCode[s.route];
      const departureTime = vnTime(ymd, s.depart);
      const arrivalTime = minutesAfter(departureTime, route.stops[route.stops.length - 1][2]);
      const tripCode = `${s.train}-${ymd.replace(/-/g, '')}`;

      const trip = await prisma.trip.upsert({
        where: { tripCode },
        update: {}, // chuyến đã có (có thể đã có đơn) thì giữ nguyên
        create: {
          tripCode,
          routeId: route.id,
          trainId: trainByCode[s.train].id,
          departureTime,
          arrivalTime,
          status: TripStatus.SCHEDULED,
        },
      });
      tripsByCode[tripCode] = trip;
      tripCount++;

      // Giờ dừng thực tế tại từng ga, tính từ giờ xuất phát của chuyến
      for (const [i, [code, , arr, dep]] of route.stops.entries()) {
        const times = {
          stopOrder: i + 1,
          arrivalTime: minutesAfter(trip.departureTime, arr),
          departureTime: minutesAfter(trip.departureTime, dep),
        };
        await prisma.tripStation.upsert({
          where: { tripId_stationId: { tripId: trip.id, stationId: st[code].id } },
          update: times,
          create: { tripId: trip.id, stationId: st[code].id, ...times },
        });
      }
    }
  }
  console.log(`   ✅ ${tripCount} chuyến: ${schedules.length} chuyến/ngày × ${SCHEDULE_DAYS} ngày (từ ${today})`);

  // ─────────────────────────────────────────────
  // 7. ĐƠN ĐẶT VÉ MẪU (đã thanh toán, có vé điện tử) cho mục "Vé của tôi"
  // ─────────────────────────────────────────────
  console.log('\n🎫 Tạo đơn đặt vé mẫu...');

  const demoBookings = [
    {
      code: 'LR-DEMO0001', email: 'customer@train.com', trip: `SE1-${addDays(today, 2).replace(/-/g, '')}`,
      seats: [['A3', 'Nguyễn Văn A', '001090012345', PassengerType.ADULT], ['A4', 'Nguyễn Minh Khang', '001215067890', PassengerType.CHILD]],
    },
    {
      code: 'LR-DEMO0002', email: 'customer@train.com', trip: `SE19-${addDays(today, 4).replace(/-/g, '')}`,
      seats: [['T1-01', 'Nguyễn Văn A', '001090012345', PassengerType.ADULT]],
    },
    {
      code: 'LR-DEMO0003', email: 'customer2@train.com', trip: `SNT1-${addDays(today, 3).replace(/-/g, '')}`,
      seats: [['T1-02', 'Trần Thị B', '079195054321', PassengerType.ADULT], ['T1-03', 'Phạm Quốc D', '079098011223', PassengerType.STUDENT]],
    },
  ] as const;

  const discountOf = (t: PassengerType) =>
    passengerDiscounts.find((d) => d.passengerType === t)?.discountPercent ?? 0;

  let demoCreated = 0;
  for (const d of demoBookings) {
    if (await prisma.booking.findUnique({ where: { bookingCode: d.code } })) continue;
    const trip = tripsByCode[d.trip];
    const user = userByEmail.get(d.email);
    if (!trip || !user) continue;
    const route = await prisma.route.findUniqueOrThrow({ where: { id: trip.routeId } });

    // Ghế demo phải còn trống (không ai giữ/đặt trên chuyến này)
    const seats = await prisma.seat.findMany({
      where: { coach: { trainId: trip.trainId }, seatNumber: { in: d.seats.map((s) => s[0]) } },
      include: { coach: true },
    });
    const taken = await prisma.bookingSeat.count({
      where: {
        seatId: { in: seats.map((s) => s.id) },
        booking: { tripId: trip.id },
        status: { in: [BookingSeatStatus.HELD, BookingSeatStatus.CONFIRMED] },
      },
    });
    if (seats.length !== d.seats.length || taken > 0) continue;

    const fareRules = await prisma.fareRule.findMany({ where: { routeId: route.id } });
    const lines = d.seats.map(([seatNumber, fullName, idNumber, passengerType]) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber)!;
      const base = Number(fareRules.find((f) => f.seatTypeId === seat.seatTypeId)!.basePrice);
      const discount = Math.round((base * discountOf(passengerType)) / 100);
      return { seat, fullName, idNumber, passengerType, base, discount, price: base - discount };
    });
    const subtotal = lines.reduce((s, l) => s + l.base, 0);
    const totalDiscount = lines.reduce((s, l) => s + l.discount, 0);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          bookingCode: d.code,
          userId: user.id,
          tripId: trip.id,
          contactName: user.fullName,
          contactPhone: user.phone,
          contactEmail: d.email,
          subtotalAmount: subtotal,
          discountAmount: totalDiscount,
          totalAmount: subtotal - totalDiscount,
          status: BookingStatus.CONFIRMED,
          confirmedAt: now,
        },
      });
      for (const l of lines) {
        const passenger = await tx.passenger.create({
          data: { bookingId: booking.id, fullName: l.fullName, idNumber: l.idNumber, passengerType: l.passengerType },
        });
        const bookingSeat = await tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            passengerId: passenger.id,
            seatId: l.seat.id,
            originStationId: route.originStationId,
            destinationStationId: route.destinationStationId,
            price: l.price,
            status: BookingSeatStatus.CONFIRMED,
          },
        });
        // Cùng định dạng với TicketService.issueTicketsForBooking
        const ticketNumber = `VE-${d.code}-${l.seat.coach.coachNumber}${l.seat.seatNumber}`;
        await tx.ticketIssue.create({
          data: {
            bookingSeatId: bookingSeat.id,
            ticketNumber,
            qrCode: `LR|${ticketNumber}|${d.code}|${l.idNumber}|${l.seat.coach.coachNumber}-${l.seat.seatNumber}`,
            status: TicketStatus.ACTIVE,
          },
        });
      }
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          paymentCode: `PAY-${d.code}`,
          provider: PaymentProvider.MOCK,
          paymentMethod: 'VIETQR',
          amount: subtotal - totalDiscount,
          status: PaymentStatus.SUCCESS,
          transactionId: `TXN-${d.code}`,
          idempotencyKey: `seed-${d.code}`,
          paidAt: now,
        },
      });
    });
    demoCreated++;
  }
  console.log(`   ✅ ${demoCreated} đơn mẫu mới (bỏ qua đơn đã có)`);

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed hoàn thành!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 TÀI KHOẢN DEMO (mật khẩu: password123):');
  for (const a of accounts) console.log(`   ${a.role.padEnd(8)} đăng nhập: ${a.username.padEnd(10)} (${a.email})`);
  console.log('\n🎫 Tra cứu vé mẫu: LR-DEMO0001 / 0912345678, LR-DEMO0003 / 0987654321');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
