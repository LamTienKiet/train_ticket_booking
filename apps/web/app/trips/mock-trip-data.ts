/**
 * =========================================================================
 * DỮ LIỆU CỨNG MẪU (MOCK DATA) CHO TRANG THÔNG TIN CHUYẾN TÀU & CHỌN CHỖ
 * =========================================================================
 * Quy định số cụm theo yêu cầu:
 * - Toa 1: Có đúng 8 cụm (8 cụm x 4 chỗ = 32 chỗ)
 * - Toa 2: Có đúng 4 cụm (4 cụm x 4 chỗ = 16 chỗ)
 * - Toa 3: Có đúng 4 cụm (4 cụm x 4 chỗ = 16 chỗ)
 */

export interface StopInfo {
  stationName: string;
  stationCode: string;
  arrivalTime: string;
  departureTime: string;
  stopDuration: string;
  isOrigin?: boolean;
  isDestination?: boolean;
}

export interface SeatItem {
  id: string;
  seatNumber: string;
  position?: 'WINDOW' | 'AISLE';
  price: number;
  isBooked: boolean; // true = Đã có người mua (màu ĐÃ CHỌN/DISABLE), false = Còn trống (màu CHƯA CHỌN)
}

export interface CoachInfo {
  id: string;
  coachNumber: number; // Toa 1, 2, 3
  coachName: string;
  coachType: 'SEATING' | 'SLEEPER_4' | 'SLEEPER_6';
  clustersCount: number; // Toa 1 có 8 cụm, Toa 2 và 3 có 4 cụm
  price: number;
  totalSeats: number;
  seats: SeatItem[];
}

export interface TrainOption {
  id: string;
  trainCode: string; // SE1, SE3, SE5, SE7...
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: number; // SỐ GHẾ CÒN LẠI (Nếu = 0 sẽ tự động DISABLE không cho click)
  minPrice: number;
  coaches: CoachInfo[];
}

export interface TripDetailData {
  tripCode: string;
  routeName: string;
  originStation: string;
  destinationStation: string;
  departureDate: string;
  distanceKm: number;
  stops: StopInfo[];
  trains: TrainOption[];
}

/**
 * Hàm sinh danh sách ghế cho 1 toa với số cụm quy định (mỗi cụm 4 chỗ)
 */
function createCoachSeats(
  prefix: string,
  clustersCount: number,
  price: number,
  bookedNumbers: number[]
): SeatItem[] {
  const seats: SeatItem[] = [];
  const total = clustersCount * 4;

  for (let i = 1; i <= total; i++) {
    const seatNum = i < 10 ? `0${i}` : `${i}`;
    const posInCluster = ((i - 1) % 4) + 1;
    // Vị trí: 1 và 4 là sát cửa sổ, 2 và 3 là sát lối đi
    const position: 'WINDOW' | 'AISLE' =
      posInCluster === 1 || posInCluster === 4 ? 'WINDOW' : 'AISLE';

    seats.push({
      id: `${prefix}-${seatNum}`,
      seatNumber: seatNum,
      position,
      price,
      isBooked: bookedNumbers.includes(i),
    });
  }

  return seats;
}

// ─────────────────────────────────────────────────────────────
// THÔNG TIN CHUYẾN TÀU CỨNG MẪU (BẠN TỰ CHỈNH SỬA TẠI ĐÂY)
// ─────────────────────────────────────────────────────────────
export const MOCK_TRIP_DETAIL: TripDetailData = {
  tripCode: 'HAN-SGN-20261101',
  routeName: 'Hà Nội ➔ Sài Gòn',
  originStation: 'Ga Hà Nội (120 Lê Duẩn)',
  destinationStation: 'Ga Sài Gòn (01 Nguyễn Thông, Q.3)',
  departureDate: 'Thứ Bảy, 01/11/2026',
  distanceKm: 1726,

  stops: [
    {
      stationName: 'Ga Hà Nội',
      stationCode: 'HAN',
      arrivalTime: '---',
      departureTime: '06:00',
      stopDuration: 'Ga xuất phát',
      isOrigin: true,
    },
    {
      stationName: 'Ga Vinh',
      stationCode: 'VIN',
      arrivalTime: '10:50',
      departureTime: '10:55',
      stopDuration: 'Đỗ 5 phút',
    },
    {
      stationName: 'Ga Huế',
      stationCode: 'HUE',
      arrivalTime: '15:00',
      departureTime: '15:08',
      stopDuration: 'Đỗ 8 phút',
    },
    {
      stationName: 'Ga Đà Nẵng',
      stationCode: 'DAD',
      arrivalTime: '16:15',
      departureTime: '16:25',
      stopDuration: 'Đỗ 10 phút',
    },
    {
      stationName: 'Ga Nha Trang',
      stationCode: 'NTR',
      arrivalTime: '23:40',
      departureTime: '23:48',
      stopDuration: 'Đỗ 8 phút',
    },
    {
      stationName: 'Ga Sài Gòn',
      stationCode: 'SGN',
      arrivalTime: '13:00 (Hôm sau)',
      departureTime: '---',
      stopDuration: 'Ga kết thúc',
      isDestination: true,
    },
  ],

  trains: [
    // ═══════════════════════════════════════════════════════════
    // TÀU 1: SE1 (Còn vé -> Chọn chỗ được)
    // ═══════════a════════════════════════════════════════════════
    {
      id: 'train-se1',
      trainCode: 'SE1',
      trainName: 'Tàu Nhanh Thống Nhất SE1',
      departureTime: '06:00',
      arrivalTime: '13:00 (+1)',
      duration: '31h 00m',
      availableSeats: 38,
      minPrice: 680000,
      coaches: [
        // TOA 1: ĐÚNG 8 CỤM (8 x 4 = 32 CHỖ)
        {
          id: 'se1-coach-1',
          coachNumber: 1,
          coachName: 'Ngồi Mềm Điều Hòa',
          coachType: 'SEATING',
          clustersCount: 8,
          price: 680000,
          totalSeats: 32,
          // Ghế đã có người mua: 1, 4, 9, 14, 20, 25, 31
          seats: createCoachSeats('se1-c1', 8, 680000, [1, 4, 9, 14, 20, 25, 31]),
        },
        // TOA 2: ĐÚNG 4 CỤM (4 x 4 = 16 CHỖ)
        {
          id: 'se1-coach-2',
          coachNumber: 2,
          coachName: 'Giường Nằm Khoang 4 VIP',
          coachType: 'SLEEPER_4',
          clustersCount: 4,
          price: 960000,
          totalSeats: 16,
          // Ghế đã có người mua: 3, 6, 11
          seats: createCoachSeats('se1-c2', 4, 960000, [3, 6, 11]),
        },
        // TOA 3: ĐÚNG 4 CỤM (4 x 4 = 16 CHỖ)
        {
          id: 'se1-coach-3',
          coachNumber: 3,
          coachName: 'Giường Nằm Khoang Tiêu Chuẩn',
          coachType: 'SLEEPER_6',
          clustersCount: 4,
          price: 810000,
          totalSeats: 16,
          // Ghế đã có người mua: 2, 7, 8, 15
          seats: createCoachSeats('se1-c3', 4, 810000, [2, 7, 8, 15]),
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // TÀU 2: SE3 (Còn vé -> Chọn chỗ được)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'train-se3',
      trainCode: 'SE3',
      trainName: 'Tàu Đêm Cao Cấp SE3',
      departureTime: '19:00',
      arrivalTime: '03:15 (+2)',
      duration: '32h 15m',
      availableSeats: 12,
      minPrice: 680000,
      coaches: [
        // TOA 1: 8 CỤM (32 CHỖ)
        {
          id: 'se3-coach-1',
          coachNumber: 1,
          coachName: 'Ngồi Mềm Điều Hòa',
          coachType: 'SEATING',
          clustersCount: 8,
          price: 680000,
          totalSeats: 32,
          seats: createCoachSeats(
            'se3-c1',
            8,
            680000,
            [1, 2, 3, 5, 8, 11, 13, 14, 17, 19, 21, 22, 26, 28, 30]
          ),
        },
        // TOA 2: 4 CỤM (16 CHỖ)
        {
          id: 'se3-coach-2',
          coachNumber: 2,
          coachName: 'Giường Nằm Khoang 4 VIP',
          coachType: 'SLEEPER_4',
          clustersCount: 4,
          price: 960000,
          totalSeats: 16,
          seats: createCoachSeats('se3-c2', 4, 960000, [1, 2, 4, 5, 7, 9, 12, 14]),
        },
        // TOA 3: 4 CỤM (16 CHỖ)
        {
          id: 'se3-coach-3',
          coachNumber: 3,
          coachName: 'Giường Nằm Khoang Tiêu Chuẩn',
          coachType: 'SLEEPER_6',
          clustersCount: 4,
          price: 810000,
          totalSeats: 16,
          seats: createCoachSeats('se3-c3', 4, 810000, [1, 3, 5, 6, 8, 10, 13, 16]),
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // TÀU 3: SE5 (HẾT CHỖ -> availableSeats = 0 => BỊ DISABLE)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'train-se5',
      trainCode: 'SE5',
      trainName: 'Tàu Thống Nhất SE5 (Sáng)',
      departureTime: '08:50',
      arrivalTime: '18:30 (+1)',
      duration: '33h 40m',
      availableSeats: 0, // HẾT VÉ -> DISABLE KHÔNG NHẤN ĐƯỢC
      minPrice: 650000,
      coaches: [
        // TOA 1: 8 CỤM (TẤT CẢ 32 GHẾ ĐÃ MUA)
        {
          id: 'se5-coach-1',
          coachNumber: 1,
          coachName: 'Ngồi Mềm Điều Hòa',
          coachType: 'SEATING',
          clustersCount: 8,
          price: 650000,
          totalSeats: 32,
          seats: createCoachSeats(
            'se5-c1',
            8,
            650000,
            Array.from({ length: 32 }, (_, idx) => idx + 1)
          ),
        },
        // TOA 2: 4 CỤM (TẤT CẢ 16 GHẾ ĐÃ MUA)
        {
          id: 'se5-coach-2',
          coachNumber: 2,
          coachName: 'Giường Nằm Khoang 4',
          coachType: 'SLEEPER_4',
          clustersCount: 4,
          price: 920000,
          totalSeats: 16,
          seats: createCoachSeats(
            'se5-c2',
            4,
            920000,
            Array.from({ length: 16 }, (_, idx) => idx + 1)
          ),
        },
        // TOA 3: 4 CỤM (TẤT CẢ 16 GHẾ ĐÃ MUA)
        {
          id: 'se5-coach-3',
          coachNumber: 3,
          coachName: 'Giường Nằm Khoang 6',
          coachType: 'SLEEPER_6',
          clustersCount: 4,
          price: 780000,
          totalSeats: 16,
          seats: createCoachSeats(
            'se5-c3',
            4,
            780000,
            Array.from({ length: 16 }, (_, idx) => idx + 1)
          ),
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // TÀU 4: SE7 (Còn vé -> Chọn chỗ được)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'train-se7',
      trainCode: 'SE7',
      trainName: 'Tàu Thống Nhất SE7',
      departureTime: '14:20',
      arrivalTime: '23:45 (+1)',
      duration: '33h 25m',
      availableSeats: 9,
      minPrice: 650000,
      coaches: [
        // TOA 1: 8 CỤM (32 CHỖ)
        {
          id: 'se7-coach-1',
          coachNumber: 1,
          coachName: 'Ngồi Mềm Điều Hòa',
          coachType: 'SEATING',
          clustersCount: 8,
          price: 650000,
          totalSeats: 32,
          seats: createCoachSeats(
            'se7-c1',
            8,
            650000,
            [
              1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23,
              25, 26, 27, 29, 30, 31,
            ]
          ),
        },
        // TOA 2: 4 CỤM (16 CHỖ)
        {
          id: 'se7-coach-2',
          coachNumber: 2,
          coachName: 'Giường Nằm Khoang 4',
          coachType: 'SLEEPER_4',
          clustersCount: 4,
          price: 920000,
          totalSeats: 16,
          seats: createCoachSeats(
            'se7-c2',
            4,
            920000,
            [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15]
          ),
        },
        // TOA 3: 4 CỤM (16 CHỖ)
        {
          id: 'se7-coach-3',
          coachNumber: 3,
          coachName: 'Giường Nằm Khoang 6',
          coachType: 'SLEEPER_6',
          clustersCount: 4,
          price: 780000,
          totalSeats: 16,
          seats: createCoachSeats(
            'se7-c3',
            4,
            780000,
            [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15]
          ),
        },
      ],
    },
  ],
};

export function getTrainById(id?: string | null): TrainOption {
  if (!id) return MOCK_TRIP_DETAIL.trains[0];
  const found = MOCK_TRIP_DETAIL.trains.find(
    (t) => t.id === id || t.trainCode.toLowerCase() === id.toLowerCase()
  );
  return found || MOCK_TRIP_DETAIL.trains[0];
}
