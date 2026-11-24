"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "./components/Navbar";
import { api } from "./utils/axiosClient";
import { fmtDate, fmtTime } from "./utils/format";

type Station = { id: string; name: string; city: string };

// Dạng 1 phần tử của GET /trips (chuyến sắp chạy, đã tính giá & chỗ trống cả tuyến)
type UpcomingTrip = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  train: { code: string; name: string };
  originStation: { id: string; name: string; city: string; code: string } | null;
  destinationStation: { id: string; name: string; city: string; code: string } | null;
  faresByType: { basePrice: number }[];
  totalAvailableSeats: number;
};

// Ảnh minh họa theo ga đến; ga khác dùng nền gradient
const CITY_IMAGES: Record<string, string> = {
  SGN: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=600",
  DAD: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=600",
  LCA: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600",
};

const FILTERS = [
  { key: "all", label: "Sắp khởi hành" },
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "7 ngày tới" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const vnDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

export default function HomePage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD theo giờ máy

  useEffect(() => {
    api
      .get<Station[]>("/stations")
      .then((res) => setStations(res.data))
      .catch(() => setError("Không tải được danh sách ga. Vui lòng thử lại."));
    api
      .get<UpcomingTrip[]>("/trips")
      .then((res) => setTrips(res.data))
      .catch(() => setTripsError(true));
  }, []);

  const [trips, setTrips] = useState<UpcomingTrip[] | null>(null);
  const [tripsError, setTripsError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const visibleTrips = useMemo(() => {
    const now = new Date();
    const todayKey = vnDay(now);
    const weekEnd = now.getTime() + 7 * 24 * 3600 * 1000;
    return (trips ?? [])
      .filter((t) => t.originStation && t.destinationStation)
      .filter((t) =>
        filter === "today"
          ? vnDay(new Date(t.departureTime)) === todayKey
          : filter === "week"
            ? new Date(t.departureTime).getTime() <= weekEnd
            : true,
      )
      .slice(0, 8);
  }, [trips, filter]);

  const handleSearch = () => {
    if (!from || !to || !date) return setError("Vui lòng chọn ga đi, ga đến và ngày đi.");
    if (from === to) return setError("Ga đi và ga đến không được trùng nhau.");
    setError("");
    router.push(`/trips?${new URLSearchParams({ from, to, date })}`);
  };

  return (
    <main className={styles.main}>
      {/* NAVBAR DÙNG CHUNG ĐỒNG BỘ AUTH */}
      <Navbar />

      {/* HERO BANNER SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.bannerWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=2000"
            alt="Train Banner"
            className={styles.bannerImage}
          />
        </div>

        {/* QUICK BOOKING WIDGET */}
        <div className={styles.bookingWidgetWrapper}>
          <div className={styles.bookingWidget}>
            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>1</span>
              <select
                className={styles.stepSelect}
                aria-label="Ga đi"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                <option value="">Chọn Ga Đi</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>2</span>
              <select
                className={styles.stepSelect}
                aria-label="Ga đến"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                <option value="">Chọn Ga Đến</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.bookingDivider}></div>

            <div className={styles.bookingStep}>
              <span className={styles.stepNum}>3</span>
              <input
                type="date"
                className={styles.stepInput}
                aria-label="Ngày đi"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button type="button" onClick={handleSearch} className={styles.fastBookBtn}>
              Tìm vé nhanh
            </button>
          </div>
          {error && (
            <p role="alert" style={{ color: "#dc2626", marginTop: 8, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>
      </section>

      {/* CHUYẾN TÀU SẮP KHỞI HÀNH (DỮ LIỆU THẬT TỪ GET /trips) */}
      <section className={styles.popularSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleLine}></span>
            CHUYẾN TÀU <span className={styles.highlight}>SẮP KHỞI HÀNH</span>
          </h2>
          <div className={styles.filterTabs} role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`${styles.filterTab} ${filter === f.key ? styles.activeFilter : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {tripsError ? (
          <p className={styles.tripsStatus}>Không tải được danh sách chuyến tàu. Vui lòng thử lại sau.</p>
        ) : !trips ? (
          <div className={styles.routesGrid} aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${styles.routeCard} ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : visibleTrips.length === 0 ? (
          <p className={styles.tripsStatus}>Không có chuyến nào trong khoảng thời gian này.</p>
        ) : (
          <div className={styles.routesGrid}>
            {visibleTrips.map((t) => {
              const o = t.originStation!;
              const d = t.destinationStation!;
              const img = CITY_IMAGES[d.code];
              const minPrice = Math.min(...t.faresByType.map((f) => f.basePrice));
              const hours = Math.floor(t.durationMinutes / 60);
              const mins = t.durationMinutes % 60;
              return (
                <Link
                  key={t.id}
                  href={`/trips/seats?tripId=${t.id}&from=${o.id}&to=${d.id}`}
                  className={styles.routeCard}
                  aria-label={`Tàu ${t.train.code} ${o.name} đến ${d.name}, khởi hành ${fmtTime(t.departureTime)} ngày ${fmtDate(t.departureTime)}`}
                >
                  <div className={styles.cardImageWrapper}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className={styles.cardImage} />
                    ) : (
                      <div className={styles.cardImageFallback}>{d.city}</div>
                    )}
                    <span className={styles.trainBadge}>{t.train.code}</span>
                    <span
                      className={`${styles.seatsBadge} ${t.totalAvailableSeats === 0 ? styles.seatsBadgeFull : ""}`}
                    >
                      {t.totalAvailableSeats > 0 ? `Còn ${t.totalAvailableSeats} chỗ` : "Hết chỗ"}
                    </span>
                  </div>

                  <div className={styles.cardInfo}>
                    <h3 className={styles.routeTitle}>
                      {o.city} → {d.city}
                    </h3>
                    <p className={styles.routeCode}>{t.train.name}</p>

                    <div className={styles.tripTimes}>
                      <div>
                        <strong>{fmtTime(t.departureTime)}</strong>
                        <span>{fmtDate(t.departureTime)}</span>
                      </div>
                      <span className={styles.tripDuration}>
                        {hours}h{mins ? ` ${mins}m` : ""}
                      </span>
                      <div className={styles.tripTimeEnd}>
                        <strong>{fmtTime(t.arrivalTime)}</strong>
                        <span>{fmtDate(t.arrivalTime)}</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>
                        {Number.isFinite(minPrice) ? (
                          <>
                            từ <strong>{minPrice.toLocaleString("vi-VN")} đ</strong>
                          </>
                        ) : (
                          "Chưa có giá"
                        )}
                      </span>
                      <span className={styles.cardCta}>Xem chi tiết →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

