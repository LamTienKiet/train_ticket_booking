"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import styles from "./page.module.css";
import Navbar from "../../components/Navbar";
import {
  MOCK_TRIP_DETAIL,
  getTrainById,
  CoachInfo,
  SeatItem,
} from "../mock-trip-data";

function SeatSelectionContent() {
  const searchParams = useSearchParams();
  const tripIdParam = searchParams.get("tripId") || searchParams.get("train") || "SE1";
  const trainParam = searchParams.get("train") || "SE1";

  // Dữ liệu mock dự phòng
  const fallbackTrain = useMemo(() => {
    return getTrainById(trainParam);
  }, [trainParam]);

  // State lưu dữ liệu ghế thật từ API Backend
  const [realTripData, setRealTripData] = useState<any>(null);

  // Lấy dữ liệu sơ đồ ghế từ API Backend
  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        const res = await fetch(`http://localhost:3001/trips/${tripIdParam}/seats`);
        if (res.ok) {
          const data = await res.json();
          setRealTripData(data);
          if (data.coaches && data.coaches.length > 0) {
            setSelectedCoachId(data.coaches[0].id);
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải sơ đồ chỗ ngồi:", e);
      }
    };
    fetchSeatMap();
  }, [tripIdParam]);

  // Đoàn tàu hiện tại (ưu tiên dữ liệu từ DB, fallback sang mock)
  const currentTrain = useMemo(() => {
    if (realTripData) {
      const coaches: CoachInfo[] = (realTripData.coaches || []).map((c: any) => ({
        id: c.id,
        coachNumber: c.coachNumber,
        coachName: c.coachName,
        coachType: c.coachType,
        clustersCount: c.clustersCount || 4,
        price: c.price || 680000,
        totalSeats: c.capacity,
        seats: (c.seats || []).map((s: any) => ({
          id: s.id,
          seatNumber: s.seatNumber,
          position: s.position,
          price: s.price || c.price || 680000,
          isBooked: s.isBooked,
        })),
      }));

      return {
        id: realTripData.tripId,
        trainCode: realTripData.trainCode,
        trainName: realTripData.trainName,
        departureTime: realTripData.departureTime,
        arrivalTime: "19:30",
        duration: realTripData.duration || "31h 15m",
        availableSeats: 30,
        minPrice: 680000,
        originStation: realTripData.originStation,
        destinationStation: realTripData.destinationStation,
        departureDate: realTripData.departureDate,
        coaches,
      };
    }
    return {
      ...fallbackTrain,
      originStation: MOCK_TRIP_DETAIL.originStation,
      destinationStation: MOCK_TRIP_DETAIL.destinationStation,
      departureDate: MOCK_TRIP_DETAIL.departureDate,
    };
  }, [realTripData, fallbackTrain]);

  // State chọn Toa xe của tàu này (mặc định Toa 1)
  const [selectedCoachId, setSelectedCoachId] = useState<string>(
    currentTrain.coaches[0]?.id || ""
  );

  // State danh sách các ghế đang chọn (mảng ID ghế)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // Toa xe hiện tại
  const currentCoach: CoachInfo = useMemo(() => {
    return (
      currentTrain.coaches.find((c) => c.id === selectedCoachId) ||
      currentTrain.coaches[0]
    );
  }, [currentTrain, selectedCoachId]);

  // Chia các ghế trong toa thành từng cụm 4 chỗ
  const seatClusters = useMemo(() => {
    const clusters: SeatItem[][] = [];
    for (let i = 0; i < currentCoach.seats.length; i += 4) {
      clusters.push(currentCoach.seats.slice(i, i + 4));
    }
    return clusters;
  }, [currentCoach]);

  // Chia thành HÀNG TRÊN và HÀNG DƯỚI (để kẹp hành lang ở giữa)
  // Toa 1 (8 cụm): 4 cụm trên, 4 cụm dưới
  // Toa 2 & 3 (4 cụm): 2 cụm trên, 2 cụm dưới
  const { topClusters, bottomClusters } = useMemo(() => {
    const half = Math.ceil(seatClusters.length / 2);
    return {
      topClusters: seatClusters.slice(0, half),
      bottomClusters: seatClusters.slice(half),
    };
  }, [seatClusters]);

  const isWideCoach = currentCoach.clustersCount === 4;

  // Click vào 1 ghế (ô vuông nhỏ)
  const handleToggleSeat = (seat: SeatItem) => {
    // Nếu ghế ĐÃ CHỌN (đã bán / có người mua) -> Không cho bấm
    if (seat.isBooked) return;

    if (selectedSeatIds.includes(seat.id)) {
      // Bỏ chọn
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      // Chọn ghế
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Hàm render 1 ô vuông ghế nhỏ (hoặc ô chữ nhật dài cho toa giường nằm)
  const renderSeatSquare = (seat: SeatItem, wide: boolean) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const isBooked = seat.isBooked;

    // 3 Trạng thái màu ô vuông:
    let seatClass = styles.seatSquareAvailable; // 1. Chưa chọn (trắng viền xám)
    if (isBooked) {
      seatClass = styles.seatSquareBooked; // 3. Đã chọn (xám đặc disable)
    } else if (isSelected) {
      seatClass = styles.seatSquareSelecting; // 2. Đang chọn (cam nổi bật)
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isBooked}
        onClick={() => handleToggleSeat(seat)}
        className={`${styles.seatSquare} ${wide ? styles.seatSquareWide : ""} ${seatClass}`}
        title={
          isBooked
            ? `Ghế ${seat.seatNumber}: Đã có người mua`
            : isSelected
              ? `Ghế ${seat.seatNumber}: Bạn đang chọn`
              : `Ghế ${seat.seatNumber}: Còn trống (${seat.price.toLocaleString("vi-VN")} đ)`
        }
      >
        {!isBooked && (
          <>
            <span>{seat.seatNumber}</span>
            {seat.position && (
              <span className={styles.seatPosLabel}>
                {seat.position === "WINDOW" ? "Cửa" : "Lối"}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  // Hàm render 1 Cụm 4 chỗ
  const renderClusterCard = (cluster: SeatItem[], cIndex: number, wide: boolean) => {
    return (
      <div
        key={cIndex}
        className={`${styles.clusterCard} ${wide ? styles.clusterCardWide : ""}`}
      >
        <div className={styles.clusterHeader}>
          <span className={styles.clusterTitle}>Cụm {cIndex + 1}</span>
          <span className={styles.clusterTag}>
            {wide ? "Khoang 4 chỗ" : "4 chỗ"}
          </span>
        </div>

        <div className={styles.clusterSeatsBody}>
          {/* 2 ghế hàng trên */}
          <div className={`${styles.seatPair} ${wide ? styles.seatPairWide : ""}`}>
            {cluster[0] && renderSeatSquare(cluster[0], wide)}
            {cluster[1] && renderSeatSquare(cluster[1], wide)}
          </div>

          {/* Bàn nhỏ ở giữa cụm 4 chỗ */}
          <div className={`${styles.clusterTable} ${wide ? styles.clusterTableWide : ""}`}>
            Bàn
          </div>

          {/* 2 ghế hàng dưới */}
          <div className={`${styles.seatPair} ${wide ? styles.seatPairWide : ""}`}>
            {cluster[2] && renderSeatSquare(cluster[2], wide)}
            {cluster[3] && renderSeatSquare(cluster[3], wide)}
          </div>
        </div>
      </div>
    );
  };

  // Lấy thông tin các ghế đang chọn để tính tiền
  const selectedSeatsList = useMemo(() => {
    const list: { coach: CoachInfo; seat: SeatItem }[] = [];
    currentTrain.coaches.forEach((coach) => {
      coach.seats.forEach((seat) => {
        if (selectedSeatIds.includes(seat.id)) {
          list.push({ coach, seat });
        }
      });
    });
    return list;
  }, [currentTrain, selectedSeatIds]);

  // Tổng tiền
  const totalAmount = useMemo(() => {
    return selectedSeatsList.reduce((sum, item) => sum + item.seat.price, 0);
  }, [selectedSeatsList]);

  return (
    <div className={styles.container}>
      {/* NÚT QUAY LẠI CHỌN TÀU KHÁC */}
      <div className={styles.backLinkRow}>
        <Link href="/trips" className={styles.backLink}>
          ← Quay lại danh sách đoàn tàu
        </Link>
      </div>

      {/* THANH THÔNG TIN TÀU ĐÃ CHỌN */}
      <div className={styles.selectedTrainBar}>
        <div className={styles.trainTitleBlock}>
          <h1 className={styles.trainHeading}>Tàu {currentTrain.trainCode}</h1>
          <span className={styles.trainSubHeading}>
            {currentTrain.originStation || MOCK_TRIP_DETAIL.originStation} ➔{" "}
            {currentTrain.destinationStation || MOCK_TRIP_DETAIL.destinationStation}
          </span>
        </div>
        <div className={styles.trainScheduleBadge}>
          Khởi hành: <strong>{currentTrain.departureTime}</strong> - Ngày:{" "}
          <strong>
            {currentTrain.departureDate || MOCK_TRIP_DETAIL.departureDate}
          </strong>{" "}
          ({currentTrain.duration})
        </div>
      </div>

      {/* LAYOUT 2 CỘT */}
      <div className={styles.seatLayoutGrid}>
        {/* CỘT TRÁI: SƠ ĐỒ CHỖ NGỒI */}
        <div className={styles.seatMapCard}>
          {/* TAB CHỌN TOA XE */}
          <div className={styles.coachSelectorSection}>
            <div className={styles.coachSelectorLabel}>Chọn Toa Xe:</div>
            <div className={styles.coachTabsList}>
              {currentTrain.coaches.map((coach) => {
                const isActive = coach.id === currentCoach.id;
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`${styles.coachTabButton} ${
                      isActive ? styles.activeCoachTab : ""
                    }`}
                  >
                    <span className={styles.coachTabNumber}>
                      Toa {coach.coachNumber}
                    </span>
                    <span className={styles.coachTabType}>{coach.coachName}</span>
                    <span className={styles.coachTabPrice}>
                      {coach.price.toLocaleString("vi-VN")} đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHÚ THÍCH 3 MÀU CHỖ NGỒI */}
          <div className={styles.seatLegendBar}>
            {/* 1. CHƯA CHỌN */}
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendSquare} ${styles.seatColorAvailable}`}
              ></span>
              <span>Chưa chọn (Còn trống)</span>
            </div>

            {/* 2. ĐANG CHỌN */}
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendSquare} ${styles.seatColorSelecting}`}
              ></span>
              <span>Đang chọn</span>
            </div>

            {/* 3. ĐÃ CHỌN (ĐÃ CÓ NGƯỜI MUA) */}
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendSquare} ${styles.seatColorBooked}`}
              ></span>
              <span>Đã chọn (Đã bán)</span>
            </div>
          </div>

          {/* MÔ PHỎNG THÂN TOA TÀU VỚI HÀNH LANG Ở GIỮA */}
          <div className={styles.carriageFrame}>
            <div className={styles.carriageHeader}>
              <span>
                Toa {currentCoach.coachNumber} - {currentCoach.coachName} ({currentCoach.totalSeats} Chỗ)
              </span>
              <span>Đầu toa ➔</span>
            </div>

            {/* HÀNG CỤM TRÊN: 4 cụm (Toa 1) hoặc 2 cụm (Toa 2 & 3) */}
            <div className={isWideCoach ? styles.clustersGridTwo : styles.clustersGridFour}>
              {topClusters.map((cluster, idx) =>
                renderClusterCard(cluster, idx, isWideCoach)
              )}
            </div>

            {/* DÒNG HÀNH LANG TOA XE NẰM Ở GIỮA */}
            <div className={styles.hallwayDivider}>
              <span className={styles.hallwayTrack}></span>
              <span className={styles.hallwayText}>HÀNH LANG TOA XE (LỐI ĐI)</span>
              <span className={styles.hallwayTrack}></span>
            </div>

            {/* HÀNG CỤM DƯỚI: 4 cụm (Toa 1) hoặc 2 cụm (Toa 2 & 3) */}
            <div className={isWideCoach ? styles.clustersGridTwo : styles.clustersGridFour}>
              {bottomClusters.map((cluster, idx) =>
                renderClusterCard(cluster, idx + topClusters.length, isWideCoach)
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG TÓM TẮT ĐẶT VÉ */}
        <aside className={styles.bookingSummaryCard}>
          <h2 className={styles.summaryHeader}>Chi tiết vé đặt</h2>

          <div className={styles.summaryRow}>
            <span>Đoàn tàu:</span>
            <strong>Tàu {currentTrain.trainCode}</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Hành trình:</span>
            <strong>{MOCK_TRIP_DETAIL.routeName}</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Ngày đi:</span>
            <strong>{MOCK_TRIP_DETAIL.departureDate}</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Giờ xuất phát:</span>
            <strong>{currentTrain.departureTime}</strong>
          </div>

          <div className={styles.divider}></div>

          {/* DANH SÁCH GHẾ ĐÃ CHỌN */}
          <div className={styles.selectedSeatsBox}>
            <div className={styles.selectedSeatsTitle}>
              Chỗ ngồi đã chọn ({selectedSeatsList.length}):
            </div>

            {selectedSeatsList.length === 0 ? (
              <div className={styles.noSeatSelectedText}>
                Vui lòng bấm vào các ô vuông ghế còn trống trên sơ đồ
              </div>
            ) : (
              <div className={styles.seatTagsList}>
                {selectedSeatsList.map(({ coach, seat }) => (
                  <span key={seat.id} className={styles.seatTagItem}>
                    Toa {coach.coachNumber} - Ghế {seat.seatNumber}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.divider}></div>

          {/* TỔNG TIỀN */}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng tiền:</span>
            <span className={styles.totalAmount}>
              {totalAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>

          {/* NÚT XÁC NHẬN CHUYỂN SANG TRANG BOOKING */}
          {selectedSeatsList.length > 0 ? (
            <Link
              href={`/booking?tripId=${realTripData?.tripId || tripIdParam}&train=${currentTrain.trainCode}&seats=${selectedSeatsList
                .map((s) => `${s.coach.coachNumber}-${s.seat.seatNumber}`)
                .join(",")}`}
              className={styles.submitBookingBtn}
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                lineHeight: "22px",
              }}
            >
              Tiếp tục nhập thông tin ({selectedSeatsList.length} vé) →
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className={styles.submitBookingBtn}
            >
              Vui lòng chọn chỗ ngồi
            </button>
          )}

          <p className={styles.securityNote}>
            Hệ thống sẽ giữ chỗ trong 10 phút để bạn tiến hành thanh toán.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function SeatPage() {
  return (
    <main className={styles.main}>
      {/* NAVBAR DÙNG CHUNG ĐỒNG BỘ AUTH */}
      <Navbar />

      {/* SUSPENSE BOUNDARY CHO SEARCH PARAMS */}
      <Suspense
        fallback={
          <div style={{ padding: "40px", textAlign: "center" }}>
            Đang tải sơ đồ chỗ ngồi...
          </div>
        }
      >
        <SeatSelectionContent />
      </Suspense>
    </main>
  );
}
