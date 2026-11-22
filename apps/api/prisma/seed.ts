import {
  PrismaClient,
  Role,
  CoachType,
  TripStatus,
  PassengerType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu...\n');

  // ─────────────────────────────────────────────
  // 1. ACCOUNTS & USERS
  // ─────────────────────────────────────────────
  console.log('👤 Tạo tài khoản...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminAccount = await prisma.account.upsert({
    where: { email: 'admin@train.com' },
    update: {},
    create: {
      email: 'admin@train.com',
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
      user: { create: { fullName: 'Quản trị viên', phone: '0900000001' } },
    },
  });

  const customerAccount = await prisma.account.upsert({
    where: { email: 'customer@train.com' },
    update: {},
    create: {
      email: 'customer@train.com',
      username: 'customer',
      passwordHash,
      role: Role.CUSTOMER,
      user: { create: { fullName: 'Nguyễn Văn A', phone: '0912345678' } },
    },
  });

  console.log(
    `   ✅ Admin: ${adminAccount.email} | Customer: ${customerAccount.email}`,
  );

  // ─────────────────────────────────────────────
  // 2. STATIONS (Nhà ga)
  // ─────────────────────────────────────────────
  console.log('\n🏛️  Tạo nhà ga...');

  const hanoi = await prisma.station.upsert({
    where: { code: 'HAN' },
    update: {},
    create: {
      code: 'HAN',
      name: 'Ga Hà Nội',
      city: 'Hà Nội',
      address: '120 Lê Duẩn, Hoàn Kiếm, Hà Nội',
      latitude: 21.0245,
      longitude: 105.8412,
    },
  });

  const vinh = await prisma.station.upsert({
    where: { code: 'VIN' },
    update: {},
    create: {
      code: 'VIN',
      name: 'Ga Vinh',
      city: 'Nghệ An',
      address: 'Phường Lê Mao, TP. Vinh, Nghệ An',
      latitude: 18.6718,
      longitude: 105.6932,
    },
  });

  const huế = await prisma.station.upsert({
    where: { code: 'HUE' },
    update: {},
    create: {
      code: 'HUE',
      name: 'Ga Huế',
      city: 'Thừa Thiên Huế',
      address: '2 Bùi Thị Xuân, TP. Huế',
      latitude: 16.4637,
      longitude: 107.5909,
    },
  });

  const danang = await prisma.station.upsert({
    where: { code: 'DAD' },
    update: {},
    create: {
      code: 'DAD',
      name: 'Ga Đà Nẵng',
      city: 'Đà Nẵng',
      address: '791 Hải Phòng, Thanh Khê, Đà Nẵng',
      latitude: 16.0748,
      longitude: 108.2069,
    },
  });

  const nhatrang = await prisma.station.upsert({
    where: { code: 'NTR' },
    update: {},
    create: {
      code: 'NTR',
      name: 'Ga Nha Trang',
      city: 'Khánh Hòa',
      address: '17 Thái Nguyên, TP. Nha Trang',
      latitude: 12.2388,
      longitude: 109.1967,
    },
  });

  const saigon = await prisma.station.upsert({
    where: { code: 'SGN' },
    update: {},
    create: {
      code: 'SGN',
      name: 'Ga Sài Gòn',
      city: 'TP. Hồ Chí Minh',
      address: '01 Nguyễn Thông, Quận 3, TP.HCM',
      latitude: 10.7812,
      longitude: 106.6827,
    },
  });

  console.log(`   ✅ 6 ga: HAN → VIN → HUE → DAD → NTR → SGN`);

  // ─────────────────────────────────────────────
  // 3. SEAT TYPES (Loại ghế)
  // ─────────────────────────────────────────────
  console.log('\n🪑 Tạo loại ghế...');

  const softSeat = await prisma.seatType.upsert({
    where: { code: 'SOFT_SEAT' },
    update: {},
    create: {
      code: 'SOFT_SEAT',
      name: 'Ghế Mềm Điều Hòa',
      priceMultiplier: 1.0,
    },
  });

  const sleeper4 = await prisma.seatType.upsert({
    where: { code: 'SLEEPER_4' },
    update: {},
    create: {
      code: 'SLEEPER_4',
      name: 'Giường Nằm Khoang 4',
      priceMultiplier: 1.5,
    },
  });

  const sleeper6 = await prisma.seatType.upsert({
    where: { code: 'SLEEPER_6' },
    update: {},
    create: {
      code: 'SLEEPER_6',
      name: 'Giường Nằm Khoang 6',
      priceMultiplier: 1.2,
    },
  });

  console.log(`   ✅ 3 loại: Ghế Mềm, Giường 4, Giường 6`);

  // ─────────────────────────────────────────────
  // 4. TRAINS + COACHES + SEATS
  // ─────────────────────────────────────────────
  console.log('\n🚂 Tạo tàu hỏa...');

  // --- Tàu SE1 (HN → SGN)
  const trainSE1 = await prisma.train.upsert({
    where: { code: 'SE1' },
    update: {},
    create: {
      code: 'SE1',
      name: 'Tàu Thống Nhất SE1',
    },
  });

  // Toa 1: Ghế mềm (10 ghế)
  const se1Coach1 = await prisma.coach.upsert({
    where: { trainId_coachNumber: { trainId: trainSE1.id, coachNumber: 1 } },
    update: {},
    create: {
      trainId: trainSE1.id,
      coachNumber: 1,
      coachType: CoachType.SEATING,
      capacity: 10,
    },
  });

  // Toa 2: Giường nằm 4 (8 giường = 2 khoang 4 người)
  const se1Coach2 = await prisma.coach.upsert({
    where: { trainId_coachNumber: { trainId: trainSE1.id, coachNumber: 2 } },
    update: {},
    create: {
      trainId: trainSE1.id,
      coachNumber: 2,
      coachType: CoachType.SLEEPER,
      capacity: 8,
    },
  });

  // Toa 3: Giường nằm 6 (12 giường = 2 khoang 6 người)
  const se1Coach3 = await prisma.coach.upsert({
    where: { trainId_coachNumber: { trainId: trainSE1.id, coachNumber: 3 } },
    update: {},
    create: {
      trainId: trainSE1.id,
      coachNumber: 3,
      coachType: CoachType.SLEEPER,
      capacity: 12,
    },
  });

  // Seats toa 1 — ghế mềm: A1-A5 tầng 1, B1-B5 tầng 2
  const coach1SeatDefs = [
    ...['A1', 'A2', 'A3', 'A4', 'A5'].map((n) => ({
      seatNumber: n,
      floorNumber: 1,
      position: 'WINDOW',
      seatTypeId: softSeat.id,
    })),
    ...['B1', 'B2', 'B3', 'B4', 'B5'].map((n) => ({
      seatNumber: n,
      floorNumber: 1,
      position: 'AISLE',
      seatTypeId: softSeat.id,
    })),
  ];

  for (const s of coach1SeatDefs) {
    await prisma.seat.upsert({
      where: { coachId_seatNumber: { coachId: se1Coach1.id, seatNumber: s.seatNumber } },
      update: {},
      create: { coachId: se1Coach1.id, ...s },
    });
  }

  // Seats toa 2 — giường khoang 4: T1-01 đến T1-08
  for (let i = 1; i <= 8; i++) {
    const seatNumber = `T${Math.ceil(i / 4)}-0${i}`;
    await prisma.seat.upsert({
      where: { coachId_seatNumber: { coachId: se1Coach2.id, seatNumber } },
      update: {},
      create: {
        coachId: se1Coach2.id,
        seatTypeId: sleeper4.id,
        seatNumber,
        floorNumber: i % 2 === 0 ? 2 : 1,
        position: i <= 4 ? 'LOWER' : 'UPPER',
      },
    });
  }

  // Seats toa 3 — giường khoang 6: T1-01 đến T2-06
  for (let i = 1; i <= 12; i++) {
    const compartment = Math.ceil(i / 6);
    const numInComp = ((i - 1) % 6) + 1;
    const seatNumber = `C${compartment}-${String(numInComp).padStart(2, '0')}`;
    await prisma.seat.upsert({
      where: { coachId_seatNumber: { coachId: se1Coach3.id, seatNumber } },
      update: {},
      create: {
        coachId: se1Coach3.id,
        seatTypeId: sleeper6.id,
        seatNumber,
        floorNumber: numInComp <= 2 ? 1 : numInComp <= 4 ? 2 : 3,
        position: numInComp % 2 === 0 ? 'UPPER' : 'LOWER',
      },
    });
  }

  // --- Tàu SE3 (HN → SGN)
  const trainSE3 = await prisma.train.upsert({
    where: { code: 'SE3' },
    update: {},
    create: {
      code: 'SE3',
      name: 'Tàu Thống Nhất SE3',
    },
  });

  const se3Coach1 = await prisma.coach.upsert({
    where: { trainId_coachNumber: { trainId: trainSE3.id, coachNumber: 1 } },
    update: {},
    create: {
      trainId: trainSE3.id,
      coachNumber: 1,
      coachType: CoachType.SEATING,
      capacity: 10,
    },
  });

  const se3Coach2 = await prisma.coach.upsert({
    where: { trainId_coachNumber: { trainId: trainSE3.id, coachNumber: 2 } },
    update: {},
    create: {
      trainId: trainSE3.id,
      coachNumber: 2,
      coachType: CoachType.SLEEPER,
      capacity: 8,
    },
  });

  // Seats SE3 toa 1
  for (const s of coach1SeatDefs) {
    await prisma.seat.upsert({
      where: { coachId_seatNumber: { coachId: se3Coach1.id, seatNumber: s.seatNumber } },
      update: {},
      create: { coachId: se3Coach1.id, ...s },
    });
  }
  // Seats SE3 toa 2
  for (let i = 1; i <= 8; i++) {
    const seatNumber = `T${Math.ceil(i / 4)}-0${i}`;
    await prisma.seat.upsert({
      where: { coachId_seatNumber: { coachId: se3Coach2.id, seatNumber } },
      update: {},
      create: {
        coachId: se3Coach2.id,
        seatTypeId: sleeper4.id,
        seatNumber,
        floorNumber: i % 2 === 0 ? 2 : 1,
        position: i <= 4 ? 'LOWER' : 'UPPER',
      },
    });
  }

  console.log(`   ✅ Tàu SE1 (3 toa, 30 ghế) + SE3 (2 toa, 18 ghế)`);

  // ─────────────────────────────────────────────
  // 5. ROUTES (Tuyến đường)
  // ─────────────────────────────────────────────
  console.log('\n🛤️  Tạo tuyến đường...');

  // Tuyến HN → SGN (đi qua VIN, HUE, DAD, NTR)
  const routeHanSgn = await prisma.route.upsert({
    where: { code: 'HAN-SGN' },
    update: {},
    create: {
      code: 'HAN-SGN',
      name: 'Hà Nội - Sài Gòn',
      originStationId: hanoi.id,
      destinationStationId: saigon.id,
      distanceKm: 1726,
      estimatedDurationMins: 31 * 60, // ~31 giờ
    },
  });

  // Các ga dừng của tuyến HAN-SGN
  const hanSgnStops = [
    { stationId: hanoi.id,    stopOrder: 1, arrivalOffsetMinutes: 0,    departureOffsetMinutes: 0    },
    { stationId: vinh.id,     stopOrder: 2, arrivalOffsetMinutes: 290,  departureOffsetMinutes: 295  },
    { stationId: huế.id,      stopOrder: 3, arrivalOffsetMinutes: 540,  departureOffsetMinutes: 548  },
    { stationId: danang.id,   stopOrder: 4, arrivalOffsetMinutes: 615,  departureOffsetMinutes: 625  },
    { stationId: nhatrang.id, stopOrder: 5, arrivalOffsetMinutes: 1060, departureOffsetMinutes: 1068 },
    { stationId: saigon.id,   stopOrder: 6, arrivalOffsetMinutes: 1860, departureOffsetMinutes: 1860 },
  ];

  for (const stop of hanSgnStops) {
    await prisma.routeStation.upsert({
      where: { routeId_stationId: { routeId: routeHanSgn.id, stationId: stop.stationId } },
      update: {},
      create: { routeId: routeHanSgn.id, ...stop },
    });
  }

  // Tuyến ngược SGN → HAN
  const routeSgnHan = await prisma.route.upsert({
    where: { code: 'SGN-HAN' },
    update: {},
    create: {
      code: 'SGN-HAN',
      name: 'Sài Gòn - Hà Nội',
      originStationId: saigon.id,
      destinationStationId: hanoi.id,
      distanceKm: 1726,
      estimatedDurationMins: 32 * 60,
    },
  });

  const sgnHanStops = [
    { stationId: saigon.id,   stopOrder: 1, arrivalOffsetMinutes: 0,    departureOffsetMinutes: 0    },
    { stationId: nhatrang.id, stopOrder: 2, arrivalOffsetMinutes: 380,  departureOffsetMinutes: 388  },
    { stationId: danang.id,   stopOrder: 3, arrivalOffsetMinutes: 900,  departureOffsetMinutes: 910  },
    { stationId: huế.id,      stopOrder: 4, arrivalOffsetMinutes: 985,  departureOffsetMinutes: 993  },
    { stationId: vinh.id,     stopOrder: 5, arrivalOffsetMinutes: 1220, departureOffsetMinutes: 1228 },
    { stationId: hanoi.id,    stopOrder: 6, arrivalOffsetMinutes: 1920, departureOffsetMinutes: 1920 },
  ];

  for (const stop of sgnHanStops) {
    await prisma.routeStation.upsert({
      where: { routeId_stationId: { routeId: routeSgnHan.id, stationId: stop.stationId } },
      update: {},
      create: { routeId: routeSgnHan.id, ...stop },
    });
  }

  console.log(`   ✅ Tuyến HAN→SGN và SGN→HAN (6 ga mỗi tuyến)`);

  // ─────────────────────────────────────────────
  // 6. FARE RULES (Bảng giá)
  // ─────────────────────────────────────────────
  console.log('\n💰 Tạo bảng giá...');

  // Giá cho tuyến HAN-SGN
  const effectiveFrom = new Date('2026-01-01T00:00:00Z');

  const faresSE_HanSgn = [
    { seatTypeId: softSeat.id, basePrice: 680_000 },
    { seatTypeId: sleeper4.id, basePrice: 960_000 },
    { seatTypeId: sleeper6.id, basePrice: 810_000 },
  ];

  for (const f of faresSE_HanSgn) {
    // Check nếu đã tồn tại (không có unique constraint, dùng findFirst)
    const existing = await prisma.fareRule.findFirst({
      where: { routeId: routeHanSgn.id, seatTypeId: f.seatTypeId },
    });

    const fareRule = existing
      ? existing
      : await prisma.fareRule.create({
          data: {
            routeId: routeHanSgn.id,
            seatTypeId: f.seatTypeId,
            basePrice: f.basePrice,
            effectiveFrom,
          },
        });

    // PassengerFareRules
    const passengerFares = [
      { passengerType: PassengerType.ADULT,  discountPercent: 0  },
      { passengerType: PassengerType.CHILD,  discountPercent: 50 },
      { passengerType: PassengerType.INFANT, discountPercent: 90 },
    ];

    for (const pf of passengerFares) {
      await prisma.passengerFareRule.upsert({
        where: {
          fareRuleId_passengerType: {
            fareRuleId: fareRule.id,
            passengerType: pf.passengerType,
          },
        },
        update: {},
        create: { fareRuleId: fareRule.id, ...pf },
      });
    }
  }

  // Giá cho tuyến SGN-HAN (giống HAN-SGN)
  const faresSE_SgnHan = [
    { seatTypeId: softSeat.id, basePrice: 680_000 },
    { seatTypeId: sleeper4.id, basePrice: 960_000 },
    { seatTypeId: sleeper6.id, basePrice: 810_000 },
  ];

  for (const f of faresSE_SgnHan) {
    const existing = await prisma.fareRule.findFirst({
      where: { routeId: routeSgnHan.id, seatTypeId: f.seatTypeId },
    });

    const fareRule = existing
      ? existing
      : await prisma.fareRule.create({
          data: {
            routeId: routeSgnHan.id,
            seatTypeId: f.seatTypeId,
            basePrice: f.basePrice,
            effectiveFrom,
          },
        });

    const passengerFares = [
      { passengerType: PassengerType.ADULT,  discountPercent: 0  },
      { passengerType: PassengerType.CHILD,  discountPercent: 50 },
      { passengerType: PassengerType.INFANT, discountPercent: 90 },
    ];

    for (const pf of passengerFares) {
      await prisma.passengerFareRule.upsert({
        where: {
          fareRuleId_passengerType: {
            fareRuleId: fareRule.id,
            passengerType: pf.passengerType,
          },
        },
        update: {},
        create: { fareRuleId: fareRule.id, ...pf },
      });
    }
  }

  console.log(`   ✅ Bảng giá: Ghế mềm 680k | Giường 4 960k | Giường 6 810k`);
  console.log(`      Chiết khấu: Trẻ em -50% | Em bé -90%`);

  // ─────────────────────────────────────────────
  // 7. TRIPS (Các chuyến tàu cụ thể)
  // ─────────────────────────────────────────────
  console.log('\n🗓️  Tạo các chuyến tàu...');

  // Lấy ngày mai và ngày kia để có data sẵn
  const today = new Date();
  const getDate = (daysFromNow: number, hour: number, minute = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // SE1: HAN → SGN — khởi hành 06:00, đến 13:00 hôm sau (~31h)
  const tripSE1_day1 = await prisma.trip.upsert({
    where: { tripCode: 'SE1-20261101' },
    // Chạy lại seed thì dời chuyến về ngày mai để luôn có chuyến tìm được
    update: { departureTime: getDate(1, 6, 0), arrivalTime: getDate(2, 13, 0) },
    create: {
      tripCode: 'SE1-20261101',
      routeId: routeHanSgn.id,
      trainId: trainSE1.id,
      departureTime: getDate(1, 6, 0),   // ngày mai 06:00
      arrivalTime: getDate(2, 13, 0),    // ngày kia 13:00
      status: TripStatus.SCHEDULED,
    },
  });

  const tripSE1_day2 = await prisma.trip.upsert({
    where: { tripCode: 'SE1-20261102' },
    update: { departureTime: getDate(2, 6, 0), arrivalTime: getDate(3, 13, 0) },
    create: {
      tripCode: 'SE1-20261102',
      routeId: routeHanSgn.id,
      trainId: trainSE1.id,
      departureTime: getDate(2, 6, 0),
      arrivalTime: getDate(3, 13, 0),
      status: TripStatus.SCHEDULED,
    },
  });

  // SE3: HAN → SGN — khởi hành 19:00, đến hôm kia 02:00
  const tripSE3_day1 = await prisma.trip.upsert({
    where: { tripCode: 'SE3-20261101' },
    update: { departureTime: getDate(1, 19, 0), arrivalTime: getDate(3, 3, 0) },
    create: {
      tripCode: 'SE3-20261101',
      routeId: routeHanSgn.id,
      trainId: trainSE3.id,
      departureTime: getDate(1, 19, 0),
      arrivalTime: getDate(3, 3, 0),
      status: TripStatus.SCHEDULED,
    },
  });

  // Chuyến ngược SGN → HAN
  const tripSE2_day1 = await prisma.trip.upsert({
    where: { tripCode: 'SE2-20261101' },
    update: { departureTime: getDate(1, 8, 0), arrivalTime: getDate(2, 16, 0) },
    create: {
      tripCode: 'SE2-20261101',
      routeId: routeSgnHan.id,
      trainId: trainSE1.id,
      departureTime: getDate(1, 8, 0),
      arrivalTime: getDate(2, 16, 0),
      status: TripStatus.SCHEDULED,
    },
  });

  console.log(
    `   ✅ 4 chuyến: SE1 (2 ngày), SE3, SE2 (ngược chiều)`,
  );

  // TripStations — thời điểm thực tế tàu dừng tại từng ga
  const createTripStations = async (
    tripId: string,
    departureTime: Date,
    stops: {
      stationId: string;
      stopOrder: number;
      arrivalOffsetMinutes: number;
      departureOffsetMinutes: number;
    }[],
  ) => {
    for (const stop of stops) {
      const arrivalTime = new Date(
        departureTime.getTime() + stop.arrivalOffsetMinutes * 60 * 1000,
      );
      const depTime = new Date(
        departureTime.getTime() + stop.departureOffsetMinutes * 60 * 1000,
      );
      const existing = await prisma.tripStation.findFirst({
        where: { tripId, stationId: stop.stationId },
      });
      if (existing) {
        await prisma.tripStation.update({
          where: { id: existing.id },
          data: {
            stopOrder: stop.stopOrder,
            arrivalTime,
            departureTime: depTime,
          },
        });
      } else {
        await prisma.tripStation.create({
          data: {
            tripId,
            stationId: stop.stationId,
            stopOrder: stop.stopOrder,
            arrivalTime,
            departureTime: depTime,
          },
        });
      }
    }
  };

  const hanSgnTripStops = hanSgnStops.map((s) => ({
    stationId: s.stationId,
    stopOrder: s.stopOrder,
    arrivalOffsetMinutes: s.arrivalOffsetMinutes,
    departureOffsetMinutes: s.departureOffsetMinutes,
  }));
  const sgnHanTripStops = sgnHanStops.map((s) => ({
    stationId: s.stationId,
    stopOrder: s.stopOrder,
    arrivalOffsetMinutes: s.arrivalOffsetMinutes,
    departureOffsetMinutes: s.departureOffsetMinutes,
  }));

  await createTripStations(tripSE1_day1.id, tripSE1_day1.departureTime, hanSgnTripStops);
  await createTripStations(tripSE1_day2.id, tripSE1_day2.departureTime, hanSgnTripStops);
  await createTripStations(tripSE3_day1.id, tripSE3_day1.departureTime, hanSgnTripStops);
  await createTripStations(tripSE2_day1.id, tripSE2_day1.departureTime, sgnHanTripStops);

  console.log(`   ✅ Đã tạo TripStation cho tất cả chuyến`);

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed hoàn thành!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 TEST CREDENTIALS:');
  console.log('   Admin:    admin@train.com    / password123');
  console.log('   Customer: customer@train.com / password123');
  console.log('\n🔍 TEST SEARCH (thay ID thực sau khi seed):');
  console.log(`   Ga Hà Nội  id: ${hanoi.id}`);
  console.log(`   Ga Vinh    id: ${vinh.id}`);
  console.log(`   Ga Huế     id: ${huế.id}`);
  console.log(`   Ga Đà Nẵng id: ${danang.id}`);
  console.log(`   Ga Nha Trang id: ${nhatrang.id}`);
  console.log(`   Ga Sài Gòn id: ${saigon.id}`);
  console.log('\n🌐 API Examples:');
  console.log(`   GET /stations`);
  console.log(`   GET /trips/search?originStationId=${hanoi.id}&destinationStationId=${saigon.id}&departureDate=2026-11-01`);
  console.log(`   GET /trips/${tripSE1_day1.id}`);
  console.log(`   GET /trips/${tripSE1_day1.id}/seats`);
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
