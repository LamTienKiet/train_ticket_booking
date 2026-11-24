"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import styles from "./page.module.css";
import Navbar from "../../components/Navbar";
import { api } from "../../utils/axiosClient";
import { apiErrorMessage } from "../../utils/apiError";

const fmtVnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;
const STEPS = ["Chọn chuyến", "Chọn chỗ", "Thông tin hành khách", "Thanh toán"];

export interface SeatItem {
  id: string;
  seatNumber: string;
  position?: "WINDOW" | "AISLE";
  price: number;
  isBooked: boolean;
}

export interface CoachInfo {
  id: string;
  coachNumber: number;
  coachName: string;
  coachType: string;
  clustersCount: number;
  price: number;
  totalSeats: number;
  seats: SeatItem[];
}

// Dạng dữ liệu GET /trips/:id/seats
export type SeatMap = {
  tripId: string;
  trainCode: string;
  trainName: string;
  routeName: string;
  originStation: string;
  destinationStation: string;
  departureTime: string;
  departureDate: string;
  duration: string;
  coaches: (Omit<CoachInfo, "totalSeats"> & { capacity: number })[];
};

function SeatSelectionContent() {
  const searchParams = useSearchParams();
  const tripIdParam = searchParams.get("tripId");
  // Chặng khách tìm (ga lên/xuống), truyền tiếp qua từng bước đặt vé
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const seg = from && to ? `&from=${from}&to=${to}` : "";

  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  // State danh sách các ghế đang chọn (mảng ID ghế)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // Lấy dữ liệu sơ đồ ghế từ API Backend
  useEffect(() => {
    if (!tripIdParam) return;
    api
      .get<SeatMap>(`/trips/${tripIdParam}/seats`, { params: { from, to } })
      .then((res) => {
        setSeatMap(res.data);
        setSelectedCoachId(res.data.coaches[0]?.id ?? "");
      })
      .catch((e) => setLoadError(apiErrorMessage(e, "Không tải được sơ đồ chỗ ngồi.")));
  }, [tripIdParam, from, to]);

  const currentTrain = useMemo(
    () =>
      seatMap && {
        ...seatMap,
        coaches: seatMap.coaches.map((c) => ({ ...c, totalSeats: c.capacity })) as CoachInfo[],
      },
    [seatMap],
  );

  // Toa xe hiện tại
  const currentCoach = currentTrain
    ? currentTrain.coaches.find((c) => c.id === selectedCoachId) || currentTrain.coaches[0]
    : undefined;

  // Chia các ghế trong toa thành từng cụm 4 chỗ
  const seatClusters = useMemo(() => {
    const clusters: SeatItem[][] = [];
    const seats = currentCoach?.seats ?? [];
    for (let i = 0; i < seats.length; i += 4) {
      clusters.push(seats.slice(i, i + 4));
    }
    return clusters;
  }, [currentCoach]);

  // Chia thành HÀNG TRÊN và HÀNG DƯỚI (để kẹp hành lang ở giữa)
  const { topClusters, bottomClusters } = useMemo(() => {
    const half = Math.ceil(seatClusters.length / 2);
    return {
      topClusters: seatClusters.slice(0, half),
      bottomClusters: seatClusters.slice(half),
    };
  }, [seatClusters]);

  const isWideCoach = currentCoach?.clustersCount === 4;

  const handleToggleSeat = (seat: SeatItem) => {
    if (seat.isBooked) return;
    setSelectedSeatIds((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id],
    );
  };

  // 1 ghế: ô vuông cho ghế ngồi, ô rộng hơn cho giường nằm
  const renderSeat = (seat: SeatItem, wide: boolean) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const pos = seat.position === "WINDOW" ? "Cửa sổ" : seat.position === "AISLE" ? "Lối đi" : "";
    const stateClass = seat.isBooked
      ? styles.seatBooked
      : isSelected
        ? styles.seatSelecting
        : styles.seatAvailable;
    const label = seat.isBooked
      ? `Ghế ${seat.seatNumber}: đã có người mua`
      : `Ghế ${seat.seatNumber}${pos ? ` (${pos})` : ""} - ${fmtVnd(seat.price)}${isSelected ? " - đang chọn" : ""}`;

    return (
      <button
        key={seat.id}
        type="button"
        disabled={seat.isBooked}
        aria-pressed={isSelected}
        aria-label={label}
        title={label}
        onClick={() => handleToggleSeat(seat)}
        className={`${styles.seat} ${wide ? styles.seatWide : ""} ${stateClass}`}
      >
        <span className={styles.seatNumber}>{seat.seatNumber}</span>
        <span className={styles.seatMeta}>{seat.isBooked ? "Đã bán" : pos}</span>
      </button>
    );
  };

  // 1 cụm 4 chỗ: 2 ghế - bàn - 2 ghế
  const renderCluster = (cluster: SeatItem[], cIndex: number, wide: boolean) => {
    const free = cluster.filter((s) => !s.isBooked).length;
    return (
      <div key={cIndex} className={`${styles.clusterCard} ${wide ? styles.clusterCardWide : ""}`}>
        <div className={styles.clusterHeader}>
          <span className={styles.clusterTitle}>
            {wide ? "Khoang" : "Cụm"} {cIndex + 1}
          </span>
          <span className={`${styles.clusterTag} ${free ? "" : styles.clusterTagFull}`}>
            {free ? `Trống ${free}/${cluster.length}` : "Hết chỗ"}
          </span>
        </div>
        <div className={styles.clusterSeatsBody}>
          <div className={styles.seatPair}>{cluster.slice(0, 2).map((s) => renderSeat(s, wide))}</div>
          <div className={styles.clusterTable}>Bàn</div>
          <div className={styles.seatPair}>{cluster.slice(2, 4).map((s) => renderSeat(s, wide))}</div>
        </div>
      </div>
    );
  };

  // Lấy thông tin các ghế đang chọn để tính tiền
  const selectedSeatsList = useMemo(() => {
    const list: { coach: CoachInfo; seat: SeatItem }[] = [];
    currentTrain?.coaches.forEach((coach) => {
      coach.seats.forEach((seat) => {
        if (selectedSeatIds.includes(seat.id)) list.push({ coach, seat });
      });
    });
    return list;
  }, [currentTrain, selectedSeatIds]);

  const totalAmount = useMemo(
    () => selectedSeatsList.reduce((sum, item) => sum + item.seat.price, 0),
    [selectedSeatsList],
  );

  if (!tripIdParam || loadError || !currentTrain || !currentCoach) {
    return (
      <div role="status" className={styles.statusBox}>
        {!tripIdParam
          ? "Chưa chọn chuyến tàu."
          : loadError || (currentTrain ? "Chuyến tàu chưa có toa nào." : "Đang tải sơ đồ chỗ ngồi...")}{" "}
        {(!tripIdParam || loadError) && <Link href="/">Tìm chuyến khác</Link>}
      </div>
    );
  }

  const coachFree = currentCoach.seats.filter((s) => !s.isBooked).length;
  const coachSelected = currentCoach.seats.filter((s) => selectedSeatIds.includes(s.id)).length;

  return (
    <div className={styles.container}>
      {/* QUAY LẠI + TIẾN TRÌNH ĐẶT VÉ */}
      <div className={styles.topRow}>
        {/* Quay về đúng kết quả tìm kiếm trước đó (URL có from/to/date) */}
        <button type="button" onClick={() => window.history.back()} className={styles.backLink}>
          <span aria-hidden>←</span> Quay lại danh sách chuyến
        </button>
        <ol className={styles.stepper} aria-label="Các bước đặt vé">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`${styles.step} ${i === 0 ? styles.stepDone : ""} ${i === 1 ? styles.stepActive : ""}`}
              aria-current={i === 1 ? "step" : undefined}
            >
              <span className={styles.stepDot}>{i === 0 ? "✓" : i + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* THẺ THÔNG TIN CHUYẾN TÀU */}
      <section className={styles.tripCard}>
        <div className={styles.tripTrain}>
          <span className={styles.trainCodeBadge}>{currentTrain.trainCode}</span>
          <div>
            <h1 className={styles.trainHeading}>Tàu {currentTrain.trainCode}</h1>
            <span className={styles.trainName}>{currentTrain.trainName}</span>
          </div>
        </div>

        <div className={styles.tripRoute}>
          <div className={styles.routePoint}>
            <span className={styles.routeTime}>{currentTrain.departureTime}</span>
            <span className={styles.routeStation}>{currentTrain.originStation}</span>
          </div>
          <div className={styles.routeLine}>
            <span className={styles.routeDuration}>{currentTrain.duration}</span>
            <span className={styles.routeTrack} aria-hidden />
          </div>
          <div className={`${styles.routePoint} ${styles.routePointEnd}`}>
            <span className={styles.routeLabel}>Ga đến</span>
            <span className={styles.routeStation}>{currentTrain.destinationStation}</span>
          </div>
        </div>

        <div className={styles.tripDate}>
          <span className={styles.tripDateLabel}>Ngày đi</span>
          <strong>{currentTrain.departureDate}</strong>
        </div>
      </section>

      <div className={styles.seatLayoutGrid}>
        {/* CỘT TRÁI: SƠ ĐỒ CHỖ NGỒI */}
        <div className={styles.seatMapCard}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNum}>1</span> Chọn toa xe
          </h2>
          <div className={styles.trainStrip}>
            {currentTrain.coaches.map((coach) => {
              const isActive = coach.id === currentCoach.id;
              const free = coach.seats.filter((s) => !s.isBooked).length;
              const picked = coach.seats.filter((s) => selectedSeatIds.includes(s.id)).length;
              return (
                <button
                  key={coach.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCoachId(coach.id)}
                  className={`${styles.coachTab} ${isActive ? styles.coachTabActive : ""}`}
                >
                  {picked > 0 && (
                    <span className={styles.coachPickedBadge} aria-label={`${picked} ghế đang chọn`}>
                      {picked}
                    </span>
                  )}
                  <span className={styles.coachTabNumber}>Toa {coach.coachNumber}</span>
                  <span className={styles.coachTabType}>{coach.coachName}</span>
                  <span className={styles.coachTabPrice}>{fmtVnd(coach.price)}</span>
                  <span className={`${styles.coachTabFree} ${free ? "" : styles.coachTabFull}`}>
                    {free ? `Còn ${free}/${coach.totalSeats} chỗ` : "Hết chỗ"}
                  </span>
                </button>
              );
            })}
            <span className={styles.locomotive}>Đầu tàu</span>
          </div>

          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNum}>2</span> Chọn chỗ trên sơ đồ
          </h2>

          <div className={styles.seatLegendBar}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.seatAvailable}`} />
              Còn trống <b>{coachFree - coachSelected}</b>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.seatSelecting}`} />
              Đang chọn <b>{coachSelected}</b>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.seatBooked}`} />
              Đã bán <b>{currentCoach.totalSeats - coachFree}</b>
            </div>
          </div>

          {/* MÔ PHỎNG THÂN TOA TÀU VỚI HÀNH LANG Ở GIỮA */}
          <div className={styles.carriageFrame}>
            <div className={styles.carriageHeader}>
              <div>
                <div className={styles.carriageTitle}>
                  Toa {currentCoach.coachNumber} · {currentCoach.coachName}
                </div>
                <div className={styles.carriageSub}>
                  {currentCoach.totalSeats} chỗ · {fmtVnd(currentCoach.price)} / chỗ
                </div>
              </div>
              <span className={styles.carriageDirection}>Hướng đầu tàu →</span>
            </div>

            <div className={isWideCoach ? styles.clustersGridTwo : styles.clustersGridFour}>
              {topClusters.map((cluster, idx) => renderCluster(cluster, idx, isWideCoach))}
            </div>

            <div className={styles.hallwayDivider}>
              <span className={styles.hallwayTrack} />
              <span className={styles.hallwayText}>Hành lang · Lối đi</span>
              <span className={styles.hallwayTrack} />
            </div>

            <div className={isWideCoach ? styles.clustersGridTwo : styles.clustersGridFour}>
              {bottomClusters.map((cluster, idx) =>
                renderCluster(cluster, idx + topClusters.length, isWideCoach),
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐẶT VÉ */}
        <aside className={styles.bookingSummaryCard}>
          <h2 className={styles.summaryHeader}>Chi tiết vé đặt</h2>

          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Đoàn tàu</dt>
              <dd>Tàu {currentTrain.trainCode}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Hành trình</dt>
              <dd>{currentTrain.routeName}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Ngày đi</dt>
              <dd>{currentTrain.departureDate}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Giờ xuất phát</dt>
              <dd>{currentTrain.departureTime}</dd>
            </div>
          </dl>

          <div className={styles.selectedSeatsBox}>
            <div className={styles.selectedSeatsTitle}>
              <span>Chỗ đã chọn ({selectedSeatsList.length})</span>
              {selectedSeatsList.length > 0 && (
                <button type="button" className={styles.clearBtn} onClick={() => setSelectedSeatIds([])}>
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            {selectedSeatsList.length === 0 ? (
              <div className={styles.emptySeats}>
                <span className={styles.emptyIcon} aria-hidden>
                  💺
                </span>
                Bấm vào ghế còn trống trên sơ đồ để chọn chỗ.
              </div>
            ) : (
              <ul className={styles.seatTicketList}>
                {selectedSeatsList.map(({ coach, seat }) => (
                  <li key={seat.id} className={styles.seatTicket}>
                    <div className={styles.seatTicketInfo}>
                      <div className={styles.seatTicketMain}>Ghế {seat.seatNumber}</div>
                      <div className={styles.seatTicketSub}>
                        Toa {coach.coachNumber} · {coach.coachName}
                      </div>
                    </div>
                    <span className={styles.seatTicketPrice}>{fmtVnd(seat.price)}</span>
                    <button
                      type="button"
                      className={styles.removeSeatBtn}
                      aria-label={`Bỏ chọn ghế ${seat.seatNumber}`}
                      onClick={() => handleToggleSeat(seat)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng tiền</span>
            <span className={styles.totalAmount}>{fmtVnd(totalAmount)}</span>
          </div>

          {selectedSeatsList.length > 0 ? (
            <Link
              href={`/booking?tripId=${currentTrain.tripId}&seats=${selectedSeatIds.join(",")}${seg}`}
              className={styles.submitBookingBtn}
            >
              Tiếp tục nhập thông tin ({selectedSeatsList.length} vé) →
            </Link>
          ) : (
            <button type="button" disabled className={styles.submitBookingBtn}>
              Vui lòng chọn chỗ ngồi
            </button>
          )}

          <p className={styles.securityNote}>
            <span aria-hidden>⏱</span> Chỗ được giữ trong <b>10 phút</b> để bạn hoàn tất thanh toán.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function SeatPage() {
  return (
    <main className={styles.main}>
      <Navbar />
      <Suspense
        fallback={
          <div role="status" className={styles.statusBox}>
            Đang tải sơ đồ chỗ ngồi...
          </div>
        }
      >
        <SeatSelectionContent />
      </Suspense>
    </main>
  );
}
